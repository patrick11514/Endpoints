import { type HeadersInit } from 'node-fetch'
import * as z from 'zod'

export type EndpointMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export type ErrorSchema = {
    status: false
    error: string | z.ZodError<any>
}

export declare class Endpoint<T> {
    constructor(endpoint: string, method: EndpointMethod, schema: z.ZodType<T>, headers?: HeadersInit)
    fetch(data?: any): Promise<T | ErrorSchema>
    fetchSafe(data?: any): Promise<
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
              data: ErrorSchema
          }
        | {
              status: true
              data: T
          }
    >
}
