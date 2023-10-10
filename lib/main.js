"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Endpoint = void 0;
const form_data_1 = __importDefault(require("form-data"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const zod_1 = require("zod");
class Endpoint {
    endpoint;
    method;
    data;
    schema;
    headers;
    constructor(endpoint, method, data, schema, headers) {
        this.endpoint = endpoint;
        this.method = method;
        this.data = data;
        this.schema = schema;
        this.headers = headers;
    }
    async fetch() {
        return new Promise(async (resolve, reject) => {
            const result = await this.executeFetch();
            if (result.status === false) {
                reject(result.error);
            }
            else {
                resolve(result.data);
            }
        });
    }
    async fetchSafe() {
        const request = await this.executeFetch();
        if (request.status === false) {
            if ('data' in request) {
                return {
                    status: false,
                    error: request.error,
                    errorData: request.data,
                };
            }
            else {
                return {
                    status: false,
                    error: request.error,
                };
            }
        }
        else {
            if ('handled' in request) {
                return {
                    status: true,
                    errorSchema: true,
                    data: request.data,
                };
            }
            else {
                return {
                    status: true,
                    errorSchema: false,
                    data: request.data,
                };
            }
        }
    }
    getHeaders() {
        const object = {
            method: this.method,
        };
        if (this.headers) {
            object['headers'] = this.headers;
        }
        switch (typeof this.data) {
            case 'string':
                object['body'] = this.data;
                break;
            case 'object':
                if (this.data instanceof form_data_1.default) {
                    object['body'] = this.data;
                }
                else {
                    object['body'] = JSON.stringify(this.data);
                }
                break;
            default:
                throw Error('Undefined data type');
        }
        return object;
    }
    async executeFetch() {
        const request = await (0, node_fetch_1.default)(this.endpoint, this.getHeaders());
        let json;
        let text = '';
        try {
            text = await request.clone().text();
            json = (await request.json());
        }
        catch (e) {
            return {
                status: false,
                data: text,
                error: e,
            };
        }
        const result = this.parseJson(json);
        return result;
    }
    parseJson(json) {
        const data = this.schema.safeParse(json);
        if (!data.success) {
            const errorSchema = zod_1.z.object({
                status: zod_1.z.literal(false),
                error: zod_1.z.string(),
            });
            const error = errorSchema.safeParse(json);
            if (!error.success) {
                return {
                    status: false,
                    handled: true,
                    error: json,
                };
            }
            else {
                return {
                    status: true,
                    handled: true,
                    data: error.data,
                };
            }
        }
        else {
            return {
                status: true,
                data: data.data,
            };
        }
    }
}
exports.Endpoint = Endpoint;
