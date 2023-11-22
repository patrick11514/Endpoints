import { z } from 'zod'
import { Endpoint, defaultErrorSchema } from './main'

const main = async () => {
    const schema = z.object({
        status: z.literal(true),
        data: z.object({
            id: z.number(),
            username: z.string(),
        }),
    })

    const inputSchema = z.string()

    const errorSchema = z.string()

    const endpoint = new Endpoint({
        endpoint: 'http://localhost:5173/api/login',
        method: 'POST',
        schema,
        inputSchema,
        errorSchema: defaultErrorSchema,
    })

    const result = await endpoint.fetchSafe('ahoj')

    if (result.status === false) {
        if (result.errorSchema) {
            console.log(result.data)
        }
    }
}

main()
