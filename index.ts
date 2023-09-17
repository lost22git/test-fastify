import { fastify } from 'fastify'
import { PrismaClient } from "@prisma/client";
import { Static, Type } from '@sinclair/typebox'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { fastifyCors } from "@fastify/cors"

class Result<T> {
  data?: T;
  code: number;
  msg: string;

  constructor(data: T, code: number, msg: string) {
    this.data = data;
    this.code = code;
    this.msg = msg;
  }
}

function ok<T>(data?: T): Result<T> {
  return { data: data, code: 0, msg: "" };
}

function err<T>(code: number, msg: string): Result<T> {
  return { code: code, msg: msg };
}

type StartupInfo = {
  pid: number;
  port: number;
};

const startup_info: StartupInfo = {
  pid: process.pid,
  port: 3000
};
console.log(`Startup info: ${JSON.stringify(startup_info)}`);




// ------ DB -----------------

const prisma = new PrismaClient({
  // log: ["query", "info", "warn", "error"]
  log: ["warn", "error"],
});

// 初始化数据
console.log("初始化数据, 开始");
await prisma.fighter.deleteMany({});
const initData = [
  { name: "隆", skill: ["波动拳"].join(",") },
  { name: "肯", skill: ["升龙拳"].join(",") },
];
await prisma.$transaction(
  initData.map((v) => prisma.fighter.create({ data: v }))
);
console.log("初始化数据，完成");


// ------ Model --------------

const t = Type

// const name_pattern =
//   "^[\u4E00-\u9FA5A-Za-z]([\u4E00-\u9FA5A-Za-z0-9_ -]*[\u4E00-\u9FA5A-Za-z0-9])?$";
// const name_pattern_desc =
//   "中文或英文开头，中文或英文或数字结尾，中间允许空格或 '-' 或 '_'";

const FighterCreate = t.Object({
  name: t.String(),
  skill: t.Array(
    t.String()
  ),
});

const FighterEdit = t.Object({
  name: t.String(),
  skill: t.Array(
    t.String()
  ),
});

const FighterNameParam = t.Object({
  name: t.String()
})

type FighterCreateT = Static<typeof FighterCreate>
type FighterEditT = Static<typeof FighterEdit>
type FighterNameParamT = Static<typeof FighterNameParam>


// ------ server -------------

const app = fastify({ logger: false })
  .withTypeProvider<TypeBoxTypeProvider>()

app.register(fastifyCors, {})

app.register(fastifySwagger, {
  mode: 'dynamic',
  openapi: {
    info: {
      title: "fastify test api",
      description: "fastify test api",
      version: "1.0.0",
    },
    externalDocs: {
      url: 'https://www.github.com',
      description: 'Find more info here'
    },
    servers: [
      {
        url: 'http://localhost'
      }
    ],
    components: {},
    security: [],
    tags: []
  }
})

app.register(fastifySwaggerUi, {
  routePrefix: '/about/api',
  initOAuth: {},
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  },
  uiHooks: {
    onRequest: function(request, reply, next) { next() },
    preHandler: function(request, reply, next) { next() }
  },
  staticCSP: true,
  transformStaticCSP: (header) => header
})


app.register((app, _, done) => {
  app
    .get("",
      {
        schema: {
          tags: ["fighter"],
          summary: "查询所有 fighter",
        }
      },
      async (_, reply) => {
        const all = await prisma.fighter.findMany()
        reply.send(ok(all))
      })
    .get<{ Params: FighterNameParamT }>("/:name",
      {
        schema: {
          tags: ["fighter"],
          summary: "查询一个 fighter, by name",
          params: FighterNameParam
        }
      },
      async (req, reply) => {
        const name = decodeURI(req.params.name)
        const found = await prisma.fighter.findUnique({ where: { name: name } })
        reply.send(ok(found))
      })
    .post<{ Body: FighterCreateT }>("",
      {
        schema: {
          tags: ["fighter"],
          summary: "新增一个 fighter",
          body: FighterCreate
        }
      }, async (req, reply) => {
        const fighter_create = req.body
        const fighter_inserted = await prisma.fighter.create({
          data: {
            name: fighter_create.name,
            skill: fighter_create.skill?.join(",") || "",
          },
        })
        reply.send(ok(fighter_inserted))
      })
    .put<{ Body: FighterEditT }>("",
      {
        schema: {
          tags: ["fighter"],
          summary: "编辑一个 fighter",
          body: FighterEdit
        }
      },
      async (req, reply) => {
        const fighter_edit = req.body
        const fighter_updated = await prisma.fighter.update({
          where: { name: fighter_edit.name },
          data: { skill: fighter_edit.skill.join(",") || "", updated_at: new Date() }
        })
        reply.send(ok(fighter_updated))
      }
    )
    .delete<{ Params: FighterNameParamT }>("/:name", {
      schema: {
        tags: ["fighter"],
        summary: "删除一个 fighter",
        params: FighterNameParam
      }
    }, async (req, reply) => {
      const name = decodeURI(req.params.name)
      const fighter_deleted = await prisma.fighter.delete({ where: { name: name } })
      reply.send(ok(fighter_deleted))
    })
  done()
}, { prefix: '/fighter' })



app.listen({ port: startup_info.port }, (err, address) => {
  if (err) { console.error(err); process.exit(1); }
  console.log(`fastify is serving at ${address}`)
})
