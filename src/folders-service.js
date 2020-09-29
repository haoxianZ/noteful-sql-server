const FoldersService = {
    getAll(knex){
        return knex.select('*').from('noteful_folders')
    },
    insertFolder(knex, newArticle){
        return knex.insert(newArticle).into('noteful_folders').returning('*').then(rows => {return rows[0]})
    },
    getById(knex,id){
        return knex.select('*').from('noteful_folders').where('id',id).first()
    },
    deleteById(knex,id){
        return knex('noteful_folders').where({id}).delete()
    },
    updateArticle(knex,id, updateArticle){
        return knex('noteful_folders').where({id}).update(updateArticle)
    }
}
module.exports =  FoldersService