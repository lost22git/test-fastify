
# dev app

## init app

```shell
mkdir test-fastify && cd test-fastify

pnpm init -y
```

## install fastify

```shell
pnpm i fastify
```

## install typescript

```shell
pnpm i -D typescript @types/node

pnpm exec tsc --init
```

`tsconfig.json`

```json
{
    "compileOptions": {
        "target": "ES2021",
        "module": "ES2022",
        "moduleResolution": "node"
    }
}
```

`package.json`
```json
{
    "scripts": {
        "build": "tsc -p tsconfig.json",
        "start": "node index.js"
    }
    "type": "module",
}
```

## install prisma
```shell
pnpm i prisma
```

### init prisma

```shell
pnpm exec prisma init --datasource-provider sqlite
```

### edit `./prisma/schema.prisma` file

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Fighter {
  id         Int       @id @default(autoincrement())
  name       String    @unique
  skill      String
  created_at DateTime  @default(now())
  updated_at DateTime?

  @@map("fighter")
}
```

### edit .env file

```env
# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

DATABASE_URL="file:./fighter.db"
```

### sync schema to db and generate migrate scripts

```shell
pnpm exec prisma migrate dev --name init-fighter-schema
```


### generate prisma client code

```shell
pnpm exec prisma generate
```

### use PrismaClient in your ts code
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
```

## install typebox and plugin for fastify

```shell
pnpm i @sinclair/typebox @fastify/type-provider-typebox
```

## install cors plugin

```shell
pnpm i @fastify/cors
```

## install swagger plugin

```shell
pnpm i @fastify/swagger

pnpm i @fastify/swagger-ui
```


# build and start app

```shell
pnpm build && pnpm start
```
