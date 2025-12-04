# development-platforms-ca
This express project is my course assignment for Development Platforms in my frontend studies. 

## Install
```
git clone <repo>
cd prosjekt
npm install
```
## Run

For dev:
```
npm run dev
```
For prod:
```
npm run build
npm run start
```

## Enviroment variables

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourPassword
DB_NAME=yourDatabase
JWT_SECRET=yourSecretKey
```
Your database needs to have the necessary tables before starting the API: 
- `users`
- `articles`

## Endpoints
- `POST /auth/register`
- `POST /auth/login`
- `GET /articles` - <i>Public</i>
- `GET /id/articles` - <i>Public</i>
- `GET /users/id/posts-with-user` - <i>Public</i>
- `POST /articles` - <i>Requires Access Token</i>
- `PUT /users/:id` - <i>Requires Auth + Accsess Token</i>
- `PATCH /users/:id` - <i>Requires Auth + Accsess Token</i>
- `DELETE /users/:id` - <i>Requires Auth + Accsess Token</i>

Please check API documentation for more info. 
http://localhost:YOURPORT/api-docs

## Motivation

In our course assignment we could choose one of two options: 

1. Express.js API
2. Frontend with Supabase

I chose option 1. This is because I wanted to learn more about how things actually works in the backend. Before this course was implemented in our studies I actually had express, mySql and TypeScript on my "need to learn" list. So the choice was easy. 

The content of this course was very nice and relevant I think. We have had a chat with the teacher on Teams which was very helpful. He gave us some additional information we could read about beyond the things we learn in the course. 

I think I learned exactly what I thought I should learn. 

I created a test-express project alongside with the content in the modules and the lesson tasks. So I went systematically through the whole thing and ended up with a nice project. After that I started the course assignment and worked more for my self, even though I had to look when I got in trouble. It was all new, so I didn't really understand the errors at the beginning. Over time I understood more about the wholeness and was able to see connections better. 

The benefits of creating a custom API versus a SaaS I think would have to be that you have more controll over data, you learn a lot more because you creating it your self, more security, flexibility, scalability and potentially a moneysaver. 

