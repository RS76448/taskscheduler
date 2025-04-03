FROM node:16-alpine


# Install tzdata on Alpine
RUN apk update && apk add --no-cache tzdata

# Set the timezone to Asia/Kolkata
RUN ln -sf /usr/share/zoneinfo/Asia/Kolkata /etc/localtime && echo "Asia/Kolkata" > /etc/timezone
# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]