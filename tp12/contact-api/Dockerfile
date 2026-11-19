FROM node:20-alpine
WORKDIR /app
RUN npm install express@4.18.2
COPY . .
EXPOSE 3000
CMD ["node", "-e", "require('express')().listen(3000)"]
