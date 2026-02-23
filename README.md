# Lock.host-wasm-js
Lock.host WASM JS example, see [Lock.host](https://github.com/rhodey/lock.host)

This demonstration uses OpenAI to control a Solana wallet:
+ Unmodified OpenAI lib
+ (Mostly) Unmodified Solana lib
+ Hit /api/joke?message=your best joke&addr=abc123
+ OAI is asked "You are to decide if a joke is funny or not"
+ If so 0.001 SOL is sent to addr

## Why
[Lock.host-node](https://github.com/rhodey/lock.host-node) demonstrates the same features but is expensive to host

[Lock.host-python](https://github.com/rhodey/lock.host-python) also demonstrates the same features and is expensive to host

It is very efficient to host WASM apps and so Lock.host has started in this direction

## Setup
Install [just](https://github.com/casey/just) then [wasmtime](https://github.com/bytecodealliance/wasmtime):
```
apt install just (or brew install just)
curl https://wasmtime.dev/install.sh -sSf | bash
```

## Run
+ [http://localhost:8080](http://localhost:8080)
+ [app wallet](https://explorer.solana.com/address/DohcaGiBiC3yuPz4gHtoA7QJhyL5N7hk3EpnfFyHZR2S?cluster=devnet)
+ [user wallet](https://explorer.solana.com/address/CFf6SMjR3eNKR7me9CGHhRNE1SwSQaPi5r4MWZQFGB2W?cluster=devnet)
```
cp example.env .env
just build
just run
just joke 'why did the worker quit his job at the recycling factory? because it was soda pressing.'
> {"signature":"25ndS3qg8EsiaN1uEBfpb63QNdWZDma8ap5Cc5Hv3P4nBM4kAd3pLJQiZHFGpYSm9HLcrzkQaz1mvDrw4Yy4Hu4X","from":"DohcaGiBiC3yuPz4gHtoA7QJhyL5N7hk3EpnfFyHZR2S","to":"CFf6SMjR3eNKR7me9CGHhRNE1SwSQaPi5r4MWZQFGB2W","thoughts":"The pun on 'soda pressing' is clever and plays with words, making it light-hearted and humorous."}
```

## How
It has only very very recently become possible to compile JS to WASM

Specifically we use [ComponentizeJS](https://github.com/bytecodealliance/ComponentizeJS) which compiles the Mozilla SpiderMonkey JS engine into WASM

The JS engine then parses and runs the app sources. Think of it like node but you dont have `fs` and `Buffer`

Because the runtime is exotic @solana/kit had to be patched to use @noble/ed25519

Expect to see SQLite show up in here soon

## Performance
1. npx loadtest -n 10000 http://localhost:8080 == 5274 RPS
2. npx loadtest -n 10000 -k http://localhost:8080 == 6010 RPS

## License
hello@lock.host

MIT
