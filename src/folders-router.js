const path = require('path')
const express = require('express')
const xss = require('xss')
const FoldersService = require('./folders-service')
const foldersRouter = express.Router()
const jsonParser = express.json()

const serializeUser = folder =>({
    id: folder.id,
    folder_name: xss(folder.folder_name)
})

foldersRouter.route('/').get((req,res,next)=>{
    const knexInstance = req.app.get('db')
    FoldersService.getAll(knexInstance)
    .then(users=>{res.json(users.map(serializeUser))})
    .catch(next)
}).post(jsonParser,(req,res,next)=>{
    const {folder_name} = req.body
    const newFolder = { folder_name}

    for(const [key,value] of Object.entries(newFolder)){
        if(value == null){
            return res.status(400).json({
                error:{message:`Missing '${key}' in request body`}
            })
        }
    }
    newFolder.folder_name = folder_name;
    FoldersService.insertFolder(req.app.get('db'), newFolder)
    .then(folder=>{
        res.status(201)
        .location(path.posix.join(req.originalUrl,`/${folder.id}`))
        .json(serializeUser(folder))
    }).catch(next)
})


foldersRouter.route('/:folderId').all((req,res,next)=>{
    FoldersService.getById(req.app.get('db'),
    req.params.folderId).then(folder=>{
        if(!folder){
            return res.status(404).json({
                error:{message:`User doesn't exist`}
            })
        }
        res.folder = folder
        next()
    }).catch(next)
}).get((req,res,next)=>{
    res.json(serializeUser(res.folder))
}).delete((req,res,next)=>{
    FoldersService.deleteUser(req.app.get('db'),
    req.params.folderId).then(numRowsAffected=>{
        res.status(204).end()
    }).catch(next)
}).patch(jsonParser, (req,res,next)=>{
    const { folder_name } = req.body
    const userToUpdate = {folder_name }
    const numberOfValues = Object.values(userToUpdate).filter(Boolean).length
    if(numberOfValues ===0){
        return res.status(400).json({
            error:{message:'Request must contain something'}
        })
    }
    FoldersService.updateUser(req.app.get('db'),req.params.folderId,userToUpdate)
    .then(numRowsAffected=>{
        res.status(204).end()
    }).catch(next)
})

module.exports = foldersRouter