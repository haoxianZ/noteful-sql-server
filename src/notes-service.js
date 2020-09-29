const NotesService = {
    getAll(knex){
        return knex.select('*').from('noteful_notes')
    },
    insertNote(knex, newArticle){
        return knex.insert(newArticle).into('noteful_notes').returning('*').then(rows => {return rows[0]})
    },
    getById(knex,id){
        return knex.select('*').from('noteful_notes').where('id',id).first()
    },
    deleteById(knex,id){
        return knex('noteful_notes').where({id}).delete()
    },
    updateArticle(knex,id, updateArticle){
        return knex('noteful_notes').where({id}).update(updateArticle)
    }
}
module.exports =  NotesService