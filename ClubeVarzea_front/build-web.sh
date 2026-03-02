#!/bin/bash

echo -e "\nIniciando criação da imagem de produção"

export VITE_API_URL="https://clubedavarzea.com.br"
export VITE_NODE_ENV="prod"
export FRONTEND_PORT="5151"

echo -e "Pasta atual: $(pwd)"
npm install || exit 1
npm run build || exit 1

echo -e "Build para produção criada com sucesso"