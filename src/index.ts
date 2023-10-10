import { z } from 'zod'
import { Endpoint } from './main'

const main = async () => {
    const schema = z.object({
        status: z.literal(true),
        data: z.object({
            id: z.number(),
            username: z.string(),
        }),
    })

    const endpoint = new Endpoint(
        'http://localhost:5173/api/login',
        'POST',
        {
            username: 'patrick115',
            password: 'pepa1234',
        },
        schema,
    )

    const result = await endpoint.fetchSafe()

    console.log(result)
}

main()
