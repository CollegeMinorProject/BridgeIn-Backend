# FROM node:20-alpine
# WORKDIR /app

# # Copy both package.json AND package-lock.json
# COPY package*.json ./

# RUN npm install

# COPY . .

# # Build the app for production (required for 'preview')
# RUN npm run build

# EXPOSE 5173

# EXPOSE 5173

# CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
# CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

# Don't copy source — it'll come from the volume mount
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]