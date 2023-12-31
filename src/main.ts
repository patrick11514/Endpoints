import FormData from 'form-data'
import nFetch, { type HeadersInit, type RequestInit } from 'node-fetch'
import { z } from 'zod'

type ErrorSchema = {
    status: false
    error: string | z.ZodError<any>
}

type EndpointMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

const zodErrorSchema = z.custom<'errorSchema'>((value) => {
    if (typeof value === 'undefined') return false
    if (typeof value !== 'object') return false

    if (value === null) return false
    if (!('name' in value)) return false

    if (value.name !== 'ZodError') return false

    if (!('issues' in value)) return false
    if (typeof value.issues !== 'object') return false
    if (!Array.isArray(value.issues)) return false

    return true
})

export const defaultErrorSchema = z.object({
    status: z.literal(false),
    error: zodErrorSchema.or(z.string()),
})

export class Endpoint<T, I, E> {
    endpoint: string
    method: EndpointMethod
    data: any
    schema: z.ZodType<T>
    inputSchema: z.ZodType<I> | undefined
    errorSchema: z.ZodType<E>
    headers: HeadersInit | undefined

    constructor({
        endpoint,
        method,
        schema,
        headers,
        inputSchema,
        errorSchema,
    }: {
        endpoint: string
        method: EndpointMethod
        schema: z.ZodType<T>
        headers?: HeadersInit
        inputSchema?: z.ZodType<I>
        errorSchema: z.ZodType<E>
    }) {
        this.endpoint = endpoint
        this.method = method
        this.schema = schema
        this.inputSchema = inputSchema
        this.errorSchema = errorSchema
        this.headers = headers
    }

    getSchema() {
        return this.schema
    }

    getInputSchema() {
        return this.inputSchema
    }

    getErrorSchema() {
        return this.errorSchema
    }

    async fetch(data?: I): Promise<T | E | ErrorSchema> {
        if (this.inputSchema) {
            const result = this.inputSchema.safeParse(data)

            if (!result.success) {
                return {
                    status: false,
                    error: result.error,
                }
            }

            this.data = result.data
        } else {
            this.data = data
        }

        return new Promise<T | E>(async (resolve, reject) => {
            const result = await this.executeFetch()

            if (result.status === false) {
                reject(result.error)
            } else {
                resolve(result.data)
            }
        })
    }

    async fetchSafe(data?: I): Promise<
        | {
              status: false
              errorSchema: false
              error: z.ZodError<T>
          }
        | {
              status: false
              errorSchema: false
              error: object
          }
        | {
              status: false
              errorSchema: false
              error: unknown
              errorData: string
          }
        | {
              status: false
              errorSchema: true
              data: E
          }
        | {
              status: true
              data: T
          }
    > {
        if (this.inputSchema) {
            const result = this.inputSchema.safeParse(data)

            if (!result.success) {
                return {
                    status: false,
                    errorSchema: false,
                    error: result.error,
                }
            }

            this.data = result.data
        } else {
            this.data = data
        }

        const request = await this.executeFetch()

        if (request.status === false) {
            if ('data' in request) {
                return {
                    status: false,
                    errorSchema: false,
                    error: request.error,
                    errorData: request.data,
                }
            } else {
                return {
                    status: false,
                    errorSchema: false,
                    error: request.error,
                }
            }
        } else {
            if ('handled' in request) {
                return {
                    status: false,
                    errorSchema: true,
                    data: request.data,
                }
            } else {
                return {
                    status: true,
                    data: request.data,
                }
            }
        }
    }

    private getHeaders() {
        const object: RequestInit = {
            method: this.method,
        }

        if (this.headers) {
            object['headers'] = this.headers
        }

        switch (typeof this.data) {
            case 'string':
                object['body'] = this.data
                break
            case 'object':
                if (this.data instanceof FormData) {
                    object['body'] = this.data
                } else {
                    object['body'] = JSON.stringify(this.data)
                }
                break
            case 'undefined':
                break
            default:
                if (this.data['toString'] !== undefined) {
                    object['body'] = this.data.toString()
                } else {
                    throw new Error('Invalid data type')
                }
        }

        return object
    }

    private async executeFetch(): Promise<
        | {
              status: true
              data: T
          }
        | {
              status: false
              error: z.ZodError<T>
          }
        | {
              status: false
              data: string
              error: unknown
          }
        | {
              status: false
              handled: true
              error: object
          }
        | {
              status: true
              handled: true
              data: E
          }
    > {
        const request = await nFetch(this.endpoint, this.getHeaders())

        let json: object
        let text = ''
        try {
            text = await request.text()
            json = JSON.parse(text) as object
        } catch (e) {
            return {
                status: false,
                data: text,
                error: e,
            }
        }

        const result = this.parseJson(json)

        return result
    }

    private parseJson(json: object):
        | {
              status: false
              error: z.ZodError<T>
          }
        | {
              status: false
              handled: true
              error: object
          }
        | {
              status: true
              handled: true
              data: E
          }
        | {
              status: true
              data: T
          } {
        const data = this.schema.safeParse(json)

        if (!data.success) {
            const error = this.errorSchema.safeParse(json)

            if (!error.success) {
                return {
                    status: false,
                    handled: true,
                    error: json,
                }
            } else {
                return {
                    status: true,
                    handled: true,
                    data: error.data as E,
                }
            }
        } else {
            return {
                status: true,
                data: data.data,
            }
        }
    }
}
