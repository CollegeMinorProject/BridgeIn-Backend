FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p public/temp

EXPOSE 3000

CMD ["npm", "run", "dev"]
