import FormData from 'form-data'
import nFetch, { type HeadersInit, type RequestInit } from 'node-fetch'
import { z } from 'zod'

type EndpointMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

type ErrorSchema = {
    status: false
    error: string
}

export class Endpoint<T> {
    endpoint: string
    method: EndpointMethod
    data: any
    schema: z.ZodType<T>
    headers: HeadersInit | undefined

    constructor(endpoint: string, method: EndpointMethod, data: any, schema: z.ZodType<T>, headers?: HeadersInit) {
        this.endpoint = endpoint
        this.method = method
        this.data = data
        this.schema = schema
        this.headers = headers
    }

    async fetch() {
        return new Promise<T | ErrorSchema>(async (resolve, reject) => {
            const result = await this.executeFetch()

            if (result.status === false) {
                reject(result.error)
            } else {
                resolve(result.data)
            }
        })
    }

    async fetchSafe(): Promise<
        | {
              status: false
              error: z.ZodError<T>
          }
        | {
              status: false
              error: object
          }
        | {
              status: false
              error: unknown
              errorData: string
          }
        | {
              status: true
              errorSchema: true
              data: ErrorSchema
          }
        | {
              status: true
              errorSchema: false
              data: T
          }
    > {
        const request = await this.executeFetch()

        if (request.status === false) {
            if ('data' in request) {
                return {
                    status: false,
                    error: request.error,
                    errorData: request.data,
                }
            } else {
                return {
                    status: false,
                    error: request.error,
                }
            }
        } else {
            if ('handled' in request) {
                return {
                    status: true,
                    errorSchema: true,
                    data: request.data,
                }
            } else {
                return {
                    status: true,
                    errorSchema: false,
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
            default:
                throw Error('Undefined data type')
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
              data: ErrorSchema
          }
    > {
        const request = await nFetch(this.endpoint, this.getHeaders())

        let json: object
        let text = ''
        try {
            text = await request.clone().text()
            json = (await request.json()) as object
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
              data: ErrorSchema
          }
        | {
              status: true
              data: T
          } {
        const data = this.schema.safeParse(json)

        if (!data.success) {
            const errorSchema: z.ZodType<ErrorSchema> = z.object({
                status: z.literal(false),
                error: z.string(),
            })

            const error = errorSchema.safeParse(json)

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
                    data: error.data,
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
