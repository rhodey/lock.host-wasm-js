build:
  npm install
  npm run build
  just plug

plug:
  wac plug \
    dist/bundle.wasm \
    --plug node_modules/sqlite-wasm-wasi/dist/component.wasm \
    -o dist/bundle.total.wasm

env:
  awk '!/^\s*#/ && NF { printf "--env %s ", $$0 }' .env

run:
  mkdir -p mount/
  wasmtime serve -S cli -S http --dir ./mount::/app dist/bundle.total.wasm $(just env)

joke joke:
  curl -G -d "addr=CFf6SMjR3eNKR7me9CGHhRNE1SwSQaPi5r4MWZQFGB2W" --data-urlencode "message={{joke}}" http://localhost:8080/api/joke && echo
