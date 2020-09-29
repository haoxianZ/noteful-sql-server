const CommentsService={
    getAllComments(knex){
        return knex.select('*').from('blogful_comments')
    },
    insertComment(knex,newComment){
        return knex.insert(newComment)
        .into('blogful_comments')
        .returning('*')
        .then(rows =>{
            //what does this mean?
            return rows[0]
        })
    },  
    getById(knex, id){
        return knex.from('blogful_comments')
        .select('*')
        .where('id', id)
        //this is just picking the first encounter?
        .first()
    },
    deleteComment(knex,id){
        return knex('blogful_comments')
        //why this is different from the id above?
        .where({id}).delete()
    },
    updateComment(knex,id,newComment){
        return knex('blogful_comments')
        .where({id}).update(newComment)
    }
}

module.exports=CommentsService