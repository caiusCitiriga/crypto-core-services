FROM node:20-alpine

WORKDIR /usr/src/app

# Set the italian timezone
RUN apk add --no-cache tzdata
ENV TZ=Europe/Rome

COPY . .

RUN npm install @nestjs/cli

# Uncomment in case of need
# Copies secret nmprc from local to container to allow install of private npm packages
# RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm install

RUN npm install
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]

