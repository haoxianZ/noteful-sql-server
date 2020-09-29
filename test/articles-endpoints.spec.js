const { expect } = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const { makeArticlesArray } = require('./articles.fixtures')
const { makeUsersArray } = require('./users.fixtures')

describe('Articles Endpoints', function() {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('clean the table', () => db.raw('TRUNCATE blogful_articles, blogful_users, blogful_comments RESTART IDENTITY CASCADE'))

  afterEach('cleanup',() => db.raw('TRUNCATE blogful_articles, blogful_users, blogful_comments RESTART IDENTITY CASCADE'))

  describe(`GET /api/articles`, () => {
    context(`Given no articles`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/articles')
          .expect(200, [])
      })
    })

    context('Given there are articles in the database', () => {
      const testArticles = makeArticlesArray()
      const testUsers = makeUsersArray();

      beforeEach('insert articles', () => {
        return db
          .into('blogful_users')
          .insert(testUsers)
          .then(() => {return db
          .into('blogful_articles')
          .insert(testArticles)} 
      )})

      it('responds with 200 and all of the articles', () => {
        return supertest(app)
          .get('/api/articles')
          .expect(200, testArticles)
      })
    })
  })

  describe(`GET /api/articles/:article_id`, () => {
    context(`Given no articles`, () => {
      it(`responds with 404`, () => {
        const articleId = 123456
        return supertest(app)
          .get(`/api/articles/${articleId}`)
          .expect(404, { error: { message: `Article not exist` } })
      })
    })

    context('Given there are articles in the database', () => {
      const testUsers = makeUsersArray();
      const testArticles = makeArticlesArray();
      
      beforeEach('insert articles', () => {
        return db
          .into('blogful_users')
          .insert(testUsers)
          .then(() => {return db
          .into('blogful_articles')
          .insert(testArticles)} 
      )
      })

      it('responds with 200 and the specified article', () => {
        const articleId = 2
        const expectedArticle = testArticles[articleId - 1]
        return supertest(app)
          .get(`/api/articles/${articleId}`)
          .expect(200, expectedArticle)
      })
    })
    context(`Given an XSS attack article`, () => {
      const testUsers = makeUsersArray();
      const testArticles = makeArticlesArray();
           const maliciousArticle = {
             id: 911,
            title: 'Naughty naughty very naughty <script>alert("xss");</script>',
             style: 'How-to',
             content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
           }
      
           beforeEach('insert malicious article', () => {
            return db
            .into('blogful_users')
            .insert(testUsers)
            .then(() => {return db
            .into('blogful_articles')
            .insert(maliciousArticle)} 
        )
           })
      
           it('removes XSS attack content', () => {
             return supertest(app)
               .get(`/api/articles/${maliciousArticle.id}`)
               .expect(200)
               .expect(res => {
                 expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                 expect(res.body.content).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
               })
           })
    })
  })

  describe('Post /api/articles',()=>{
    const testUsers = makeUsersArray();
    beforeEach('insert malicious article', () => {
      return db
        .into('blogful_users')
        .insert(testUsers)
    })
  it('creastes an article and respond it',()=>{
    this.retries(3)
    const newArticle = {
      title: 'test',
      style: 'Story',
      content:'testing new article'
    }
    return supertest(app).post('/api/articles')
    .send(newArticle).expect(201).expect(res=>{
      expect(res.body.title).to.eql(newArticle.title)
      expect(res.body.style).to.eql(newArticle.style)
      expect(res.body.content).to.eql(newArticle.content)
      expect(res.body).to.have.property('id')
      expect(res.headers.location).to.eql(`/api/articles/${res.body.id}`)
      const expected = new Date().toLocaleString()
      const actual = new Date(res.body.date_published).toLocaleString()
      expect(actual).to.eql(expected)
    }).then(postRes=>
      supertest(app).get(
        `/api/articles/${postRes.body.id}`
      ).expect(postRes.body))
  })
  const requiredFileds = ['title','style','content' ]
  requiredFileds.forEach(field=>{
    const newArticle = {
      title: 'test',
      style: 'Story',
      content:'testing new article'
    }
  it(`respond with 400 error when miss a field`,()=>{
    delete newArticle[field]
    return supertest(app).post('/api/articles')
    .send(newArticle).expect(400,{error: {message:`Missing '${field}' in request body`}})
  })  
  })
})

describe(`Delete /api/articles/:article_id`,()=>{
  context('Given there are article',()=>{
    const testUsers = makeUsersArray();
    const testArticles = makeArticlesArray()
    beforeEach('insert articles', () => {
      return db
        .into('blogful_users')
        .insert(testUsers)
        .then(() => {
          return db
            .into('blogful_articles')
            .insert(testArticles)
        })
    })
    it('respond with 204 and remove',()=>{
      const idRemove = 2;
      const expectArticles = testArticles.filter(article=> article.id !==idRemove)
      return supertest(app).delete(`/api/articles/${idRemove}`)
      .expect(204).then(res=> supertest(app).get('/api/articles').expect(expectArticles))
    })
    })
    
  })
  context('Given no article',()=>{
    it('respond with 404',()=>{
      return supertest(app).delete('/api/articles/123')
      .expect(404,{error:{message:'Article not exist'}})
    })
  })

  describe(`PATCH /api/articles/:article_id`,()=>{
    context('Given no article',()=>{
      it('respond with 404',()=>{
        const articleId = 123456
        return supertest(app).patch(`/api/articles/${articleId}`)
        .expect(404, {error:{message: 'Article not exist'}})
  
      })
    })
    context('Given there is data',()=>{
      const testUsers = makeUsersArray();
      const testArticles = makeArticlesArray()
      beforeEach('insert articles', () => {
        return db
            .into('blogful_users')
            .insert(testUsers)
            .then(() => {
              return db
                .into('blogful_articles')
                .insert(testArticles)
            })
      })
      it('respond with 204 and remove',()=>{
        const idUpdated = 2;
        const updateArticle={
          title: 'update',
          style:'Interview',
          content: 'test'
        }
        //not understand line187-189, tgat replace the target?
        const expectedArticle = {
          ...testArticles[idUpdated-1],
          ...updateArticle
        }
        return supertest(app).patch(`/api/articles/${idUpdated}`)
        .send(updateArticle).expect(204)
        .then(res=> supertest(app).get(`/api/articles/${idUpdated}`)
        .expect(expectedArticle))
      })
      it('respond with 400 when required field is missing',()=>{
        const idToUpdate = 2
        return supertest(app).patch(`/api/articles/${idToUpdate}`)
        .send({ irrelevantField: 'foo' }).expect(400, 
        {error:
          {message: `Request body must contain either 'title', 'style' or 'content'`}
        }
      )
    })
    it(`responds with 204 when updating only a subset of fields`, () => {
            const idToUpdate = 2
            const updateArticle = {
              title: 'updated article title',
            }
            const expectedArticle = {
              ...testArticles[idToUpdate - 1],
              ...updateArticle
            }
      
            return supertest(app)
              .patch(`/api/articles/${idToUpdate}`)
              .send({
                ...updateArticle,
                fieldToIgnore: 'should not be in GET response'
              })
              .expect(204)
              .then(res =>
                supertest(app)
                  .get(`/api/articles/${idToUpdate}`)
                  .expect(expectedArticle)
              )
          })
  })
  })
  
})
