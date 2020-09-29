const express = require('express')
const NotesService = require('./notes-service')
const notesRouter = express.Router()
const jsonParser = express.json()
const path = require('path')
const xss = require('xss')
notesRouter.route('/').get((req,res,next)=>{
    NotesService.getAll(req.app.get('db'))
    .then(notes=>{
        res.json(notes)
    }).catch(next)
}).post(jsonParser,(req,res,next)=>{
    const { note_name, modified, folderid, content } = req.body
    const newNote = { note_name, modified, folderid }
    for (const [key, value] of Object.entries(newNote)){
      if (value == null){
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
    })}}
    newNote.content = content
    NotesService.insertNote(
      req.app.get('db'),
      newNote
    )
      .then(note => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl,`/${note.id}` ) )
          .json(note)
      })
      .catch(next)
})

notesRouter.route('/:noteId')
.all((req,res,next)=>{
    const knexInstance = req.app.get('db')
    NotesService.getById(knexInstance,req.params.noteId)
    .then(note=>{
        if (!note){
            return res.status(404).json({
                error:{message: 'Note not exist'}
            })
        }
        res.note = note
        next()
    }).catch(next)})
    .get((req,res,next)=>{
        res.json({
            id:res.note.id,
            folderid: res.note.folderid,
            note_name: xss(res.note.note_name),
            modified: xss(res.note.modified),
            content: xss(res.note.content)
        })
    }       
).delete((req,res,next)=>{
    NotesService.deleteById(req.app.get('db'),req.params.noteId)
    .then(()=>{
        res.status(204).end()
    }).catch(next)
}).patch(jsonParser,(req,res,next)=>{
    const {note_name, modified, folderId} = req.body
    const articleToUpdate = {note_name, modified, folderid}
    const numberOfValues = Object.values(articleToUpdate).filter(Boolean).length
      if (numberOfValues === 0) {
          return res.status(400).json({
              error:{message: `Request body must contain either 'note_name', 'folderId' or 'modified'`}
          })
      }
    NotesService.updateNote(
        req.app.get('db'),
        req.params.noteId,
        articleToUpdate
        //what is the numRowsAffected?
        ).then(numRowsAffected=>{
          res.status(204).end()  
        }).catch(next)
})

module.exports = notesRouter