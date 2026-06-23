/**
 * Postman Echo Collection v2.1 — truncated fixture for golden tests.
 *
 * A representative subset of the Postman Echo API covering:
 * - A GET request (GET /get)
 * - A POST request with JSON body (POST /post)
 * - An auth-required request (GET /basic-auth)
 * - A request using collection variables (GET /{{path}})
 *
 * Postman Collection v2.1 format.
 */
export const POSTMAN_ECHO_COLLECTION = {
  info: {
    _postman_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Postman Echo',
    description:
      'Postman Echo is a simple API that can be used to test HTTP clients.\n\nIt returns everything sent to it in the response.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    _exporter_id: '12345678',
  },
  item: [
    {
      name: 'GET Request',
      request: {
        method: 'GET',
        header: [
          {
            key: 'Accept',
            value: 'application/json',
            type: 'text',
          },
        ],
        url: {
          raw: 'https://postman-echo.com/get',
          protocol: 'https',
          host: ['postman-echo', 'com'],
          path: ['get'],
          query: [
            {
              key: 'foo1',
              value: 'bar1',
              disabled: false,
              description: 'A sample query parameter',
            },
            {
              key: 'foo2',
              value: 'bar2',
              disabled: false,
            },
          ],
        },
        description:
          'A simple GET request to the Echo API. Returns the query parameters and headers sent.',
      },
      response: [
        {
          name: 'Successful GET Response',
          status: 'OK',
          code: 200,
          header: [
            {
              key: 'Content-Type',
              value: 'application/json; charset=utf-8',
            },
          ],
          body: '{\n  "args": {"foo1": "bar1", "foo2": "bar2"},\n  "headers": {"accept": "application/json"},\n  "url": "https://postman-echo.com/get?foo1=bar1&foo2=bar2"\n}',
        },
      ],
    },
    {
      name: 'POST Request (JSON)',
      request: {
        method: 'POST',
        header: [
          {
            key: 'Content-Type',
            value: 'application/json',
            type: 'text',
          },
          {
            key: 'Accept',
            value: 'application/json',
            type: 'text',
          },
        ],
        url: {
          raw: 'https://postman-echo.com/post',
          protocol: 'https',
          host: ['postman-echo', 'com'],
          path: ['post'],
        },
        body: {
          mode: 'raw',
          raw: JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            age: 30,
          }),
          options: {
            raw: {
              language: 'json',
            },
          },
        },
        description: 'A POST request with a JSON body. Echo returns the body and headers.',
      },
      response: [
        {
          name: 'Successful POST Response',
          status: 'OK',
          code: 200,
          header: [
            {
              key: 'Content-Type',
              value: 'application/json; charset=utf-8',
            },
          ],
          body: '{\n  "args": {},\n  "data": {"name": "John Doe", "email": "john@example.com", "age": 30},\n  "headers": {"content-type": "application/json"},\n  "url": "https://postman-echo.com/post"\n}',
        },
      ],
    },
    {
      name: 'Basic Auth',
      request: {
        method: 'GET',
        header: [
          {
            key: 'Accept',
            value: 'application/json',
            type: 'text',
          },
        ],
        url: {
          raw: 'https://postman-echo.com/basic-auth',
          protocol: 'https',
          host: ['postman-echo', 'com'],
          path: ['basic-auth'],
        },
        auth: {
          type: 'basic',
          basic: [
            {
              key: 'username',
              value: 'postman',
              type: 'string',
            },
            {
              key: 'password',
              value: 'password',
              type: 'string',
            },
          ],
        },
        description: 'Test Basic Authentication. Use username "postman" and password "password".',
      },
      response: [
        {
          name: 'Authenticated',
          status: 'OK',
          code: 200,
          header: [
            {
              key: 'Content-Type',
              value: 'application/json; charset=utf-8',
            },
          ],
          body: '{\n  "authenticated": true\n}',
        },
        {
          name: 'Unauthenticated',
          status: 'Unauthorized',
          code: 401,
          header: [
            {
              key: 'WWW-Authenticate',
              value: 'Basic realm="Fake Realm"',
            },
          ],
          body: '{\n  "authenticated": false\n}',
        },
      ],
    },
    {
      name: 'Dynamic Variable Path',
      request: {
        method: 'GET',
        header: [
          {
            key: 'Accept',
            value: 'application/json',
            type: 'text',
          },
        ],
        url: {
          raw: 'https://postman-echo.com/{{path}}',
          protocol: 'https',
          host: ['postman-echo', 'com'],
          path: ['{{path}}'],
          variable: [
            {
              key: 'path',
              value: 'get',
              description: 'Collection variable for the path segment',
            },
          ],
        },
        description: 'A request using a collection variable in the URL path.',
      },
      response: [
        {
          name: 'Variable Resolved Response',
          status: 'OK',
          code: 200,
          header: [
            {
              key: 'Content-Type',
              value: 'application/json; charset=utf-8',
            },
          ],
          body: '{\n  "args": {},\n  "url": "https://postman-echo.com/get"\n}',
        },
      ],
    },
  ],
  variable: [
    {
      key: 'path',
      value: 'get',
      type: 'string',
      description: 'The path segment to use in the URL',
    },
    {
      key: 'baseUrl',
      value: 'https://postman-echo.com',
      type: 'string',
      description: 'Base URL for all requests',
    },
  ],
} as const;
