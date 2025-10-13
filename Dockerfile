FROM node:20-alpine as builder

WORKDIR /app

COPY . /app

RUN npm install

ENV NODE_ENV production

RUN npm run build

FROM node:20-alpine As production

ENV NODE_ENV production

# Copy the bundled code from the build stage to the production image
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/main.js"]