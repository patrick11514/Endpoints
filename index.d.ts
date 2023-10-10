import { type HeadersInit } from 'node-fetch'
import * as z from 'zod'

export type EndpointMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export type ErrorSchema = {
    status: false
    error: string
}

export declare class Endpoint<T> {
    constructor(endpoint: string, method: EndpointMethod, schema: z.ZodType<T>, headers?: HeadersInit)
    fetch(data: any): Promise<T | ErrorSchema>
    fetchSafe(data: any): Promise<
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
    >
}
