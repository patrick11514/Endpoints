import { type HeadersInit } from 'node-fetch'
import * as z from 'zod'

type EndpointMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

type ErrorSchema = {
    status: false
    error: string | z.ZodError<any>
}

export declare const defaultErrorSchema: z.ZodType<ErrorSchema>
export declare class Endpoint<T, I, E> {
    constructor(
        endpoint: string,
        method: EndpointMethod,
        schema: z.ZodType<T>,
        headers?: HeadersInit,
        inputSchema?: z.ZodType<I>,
        errorSchema?: z.ZodType<E>,
    )
    fetch(data: I): Promise<T | E | ErrorSchema>
    fetchSafe(data: I): Promise<
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
    >
}
