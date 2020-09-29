require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const notesRouter = require('./notes-router')
const app = express()
const foldersRouter = require('./folders-router')

app.get('/', (req, res) => {
       res.send('Hello, world!')
     })


const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
app.use('/notes',notesRouter)
app.use('/folders',foldersRouter)
app.use(function errorHandler(error, req, res, next) {
         let response
         if (process.env.NODE_ENV === 'production') {
           response = { error: { message: 'server error' } }
         } else {
           console.error(error)
           response = { message: error.message, error }
         }
         res.status(500).json(response)
       })
app.get('/xss', (req, res) => {
        res.cookie('secretToken', '1234567890');
        res.sendFile(__dirname + '/xss-example.html');
      });
module.exports = app
