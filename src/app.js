import './shim.js'
import { AutoRouter } from 'itty-router'
import { getEnvironment } from 'wasi:cli/environment@0.2.3'
import { addressFromStr, signerFromSeed, getBalance, transfer } from './sol.js'
import OpenAI from 'openai'

const env = (name) => {
  const env = new Map(getEnvironment())
  return env.get(name)
}

let oai = null
const getOai = () => {
  if (oai) { return oai }
  return oai = new OpenAI({
    apiKey: env('openai_key'),
    dangerouslyAllowBrowser: true,
  })
}

let signer = null
const getSolSigner = async () => {
  if (signer) { return signer }
  const seed = 'persistent keys arrive soon'
  return signerFromSeed(seed).then((ok) => {
    return signer = ok
  })
}

const on400 = () => new Response('400', { status: 400, headers: { 'Content-Type': 'text/plain' } })

const on500 = (err) => {
  console.log('500 error', err)
  return new Response('500', { status: 500, headers: { 'Content-Type': 'text/plain' } })
}

const getBalancee = async (req) => {
  console.log('get balance')
  const signer = await getSolSigner()
  const addr = req.query?.addr ? req.query.addr : String(signer.address)
  const address = await addressFromStr(addr)
  const rpc = env('solana_net')
  let balance = await getBalance(address, rpc)
  balance = JSON.stringify({ balance, addr })
  return new Response(balance, { status: 200, headers: { 'Content-Type': 'application/json' } })
}

const tools = [{
  type: 'function',
  'function': {
    name: 'record_if_joke_was_funny',
    description: 'Record if joke was funny',
    parameters: {
      type: 'object',
      properties: {
        thoughts: { type: 'string' },
        decision: {
          type: 'string',
          enum: ['funny', 'not'],
        },
      },
      required: ['thoughts', 'decision'],
      additionalProperties: false,
    },
    strict: true,
  }
}]

const getJoke = async (req) => {
  console.log('get joke')
  const { addr, message } = req.query
  if (!message) { return on400() }
  if (!addr) { return on400() }
  const address = await addressFromStr(addr)

  const messages = [
    { role: 'system', content: 'You are to decide if a joke is funny or not' },
    { role: 'user', content: message },
  ]

  let reply = await getOai().chat.completions.create({
    model: 'gpt-4o-mini', temperature: 1,
    tools, tool_choice: { type: 'function', 'function': { name: 'record_if_joke_was_funny' }},
    messages,
  })

  let funny = null

  try {
    reply = reply.choices[0].message.tool_calls[0]
    reply = JSON.parse(reply.function.arguments)
    console.log('oai reply', reply)
    funny = reply.decision === 'funny'
  } catch (err) {
    return on500(err)
  }

  if (!funny) {
    const data = JSON.stringify({ thoughts: reply.thoughts })
    return new Response(data, { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  const signer = await getSolSigner()
  const from = String(signer.address)
  const to = addr

  const rpc = env('solana_net')
  const lamports = 1_000_000
  const signature = await transfer(signer, to, lamports, rpc)

  const data = JSON.stringify({ signature, from, to, thoughts: reply.thoughts })
  return new Response(data, { status: 200, headers: { 'Content-Type': 'application/json' } })
}

const router = AutoRouter({
  catch: (err, req) => {
    return on500(err)
  }
})

router
  .get('/', () => new Response('hi!'))
  .get('/api/balance', async (req) => await getBalancee(req))
  .get('/api/joke', async (req) => await getJoke(req))

addEventListener('fetch', async (event) => {
  event.respondWith(router.fetch(event.request))
})
