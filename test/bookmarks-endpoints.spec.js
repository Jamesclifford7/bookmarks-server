const { expect } = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const { updateBookmark } = require('../src/bookmarks-service')

describe.only('Bookmarks Endpoints', function() {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg', 
            connection: process.env.TEST_DATABASE_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks_list').truncate())

    afterEach('cleanup', () => db('bookmarks_list').truncate())

    // afterEach('cleanup', () => db('bookmarks_list/:bookmark_id').truncate())

    context('Given there are bookmarks in the database', () => {
        const testBookmarks = [
            {
                id: 1, 
                title: "ESPN", 
                url: "https://www.espn.com/", 
                description: "ESPN is an American multinational basic cable sports channel owned by ESPN Inc., owned jointly by The Walt Disney Company and Hearst Communications.", 
                rating: "3"
            }, 
            {
                id: 2,
                title: "LA Times", 
                url: "https://www.latimes.com/",
                description: "The Los Angeles Times is a daily newspaper based in El Segundo, California, which has been published in Los Angeles, California, since 1881.", 
                rating: "3"
            }, 
            {
                id: 3,
                title: "Zillow", 
                url: "https://www.zillow.com/",
                description: "Zillow Group, Inc., or simply Zillow, is an American online real estate database company that was founded in 2006.", 
                rating: "4"
            }
        ]; 

        beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks_list')
                .insert(testBookmarks)
        })

        it('GET /api/bookmarks responds with 200 and all of the bookmarks', () => {
            return supertest(app)
                .get('/api/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, testBookmarks)
        })
        
        it('GET /api/bookmarks/:bookmarks_id responds with 200 and the specified article', () => {
            const bookmarkId = 2
            const expectedBookmark = testBookmarks[bookmarkId - 1]
            return supertest(app)
                .get(`/api/bookmarks/${bookmarkId}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, expectedBookmark)
        })
        
        describe.only(`POST /api/bookmarks`, () => {
            it(`creates a new bookmark, responding with 201 and the new bookmark`, function() {
                // this.retries(3)
                const newBookmark = {
                    title: 'Test new bookmark', 
                    url: 'bookmark.com', 
                    description: 'Test new bookmark content...', 
                    rating: '5'
                }
                return supertest(app)
                    .post('/api/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(newBookmark)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.title).to.eql(newBookmark.title)
                        expect(res.body.url).to.eql(newBookmark.url)
                        expect(res.body.description).to.eql(newBookmark.description)
                        expect(res.body.rating).to.eql(newBookmark.rating)
                        expect(res.body).to.have.property('id')
                        expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
                        // const expected = new Date().toLocaleString('en', { timeZone: 'UTC' })
                        // const actual = new Date(res.body.date_published).toLocaleString()
                        // expect(actual).to.eql(expected)
                    }) 
                    .then(postRes =>
                        supertest(app)
                        .get(`/api/bookmarks/${postRes.body.id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(postRes.body) 
                    )
                    
                /*
                return supertest(app)
                    .post('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send({
                        title: 'Test new bookmark', 
                        url: 'bookmark.com', 
                        description: 'Test new bookmark content...', 
                        rating: '5'
                    })
                    .expect(201) */
            })

            it(`responds with 400 and an error message when the 'title' is missing`, () => {
                return supertest(app)
                    .post('/api/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send({
                        url: 'bookmark.com', 
                        description: 'Test new bookmark content...', 
                        rating: '5'
                    })
                    .expect(400, {
                        error: { message: `Missing 'title' in request body` }
                    })
            })

            it(`responds with 400 and an error message when the 'url' is missing`, () => {
                return supertest(app)
                    .post('/api/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send({
                        title: 'Test new bookmark',  
                        description: 'Test new bookmark content...', 
                        rating: '5'
                    })
                    .expect(400, {
                        error: { message: `Missing 'url' in request body` }
                    })
            })
        })

        describe(`DELETE /api/bookmarks/:bookmark_id`, () => {
            context('Given there are bookmarks in the database', () => {
                // const testBookmarks = makeBookmarksArray()
                /*
                beforeEach('insert bookmarks', () => {
                    return db
                        .into('bookmarks_list')
                        .insert(testBookmarks)
                })  */

                it('responds with 204 and removes the article', () => {
                    const idToRemove = 2
                    const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
                    return supertest(app)
                        .delete(`/api/bookmarks/${idToRemove}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(204)
                        .then( res =>
                            supertest(app)
                                .get(`/api/bookmarks`)
                                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                                .expect(expectedBookmarks)
                        )
                })
            })
            
            context(`Given there are no bookmarks in the database`, () => {
                it(`responds with 404`, () => {
                    const bookmarkId = 123456
                    return supertest(app)
                        .delete(`/api/bookmarks/${bookmarkId}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(404, { error: { message: `Bookmark doesn't exist` } })
                })
            })
            
        })

        describe(`PATCH /api/bookmarks/bookmark_id:`, () => {
            context(`Given no articles`, () => {
                it(`responds with 404`, () => {
                    const bookmarkId = 123456
                    const updateBookmark = {
                        title: "updated bookmark", 
                        url: "updatedbookmark.com", 
                        description: "this is a description of an updated bookmark", 
                        rating: "4"
                    }
                    return supertest(app)
                        .patch(`/api/bookmarks/${bookmarkId}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .send(updateBookmark)
                        .expect(404, { error: { message: `Bookmark doesn't exist` } })
                })
            }) // this will not work because I didn't refactor the bookmarks-router to have .route('/:bookmark_id).all()
            

            
            context('Given there are articles in the database', () => {
                it('responds with 204 and updates the articles', () => {
                    const idToUpdate = 2
                    const updateBookmark = {
                        title: "updated bookmark", 
                        url: "updatedbookmark.com", 
                        description: "this is a description of an updated bookmark", 
                        rating: "4"
                    }
                    const expectedBookmark = {
                        ...testBookmarks[idToUpdate -1], 
                        ...updateBookmark
                    }
                    return supertest(app)
                        .patch(`/api/bookmarks/${idToUpdate}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .send(updateBookmark)
                        .expect(204)
                        .then(res => 
                            supertest(app)
                                .get(`/api/bookmarks/${idToUpdate}`)
                                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                                .expect(expectedBookmark)
                        )
                })

                it('responds with 400 when no required fields supplied', () => {
                    const idToUpdate = 2
                    return supertest(app)
                        .patch(`/api/bookmarks/${idToUpdate}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .send({ irrelevantField: 'foo' })
                        .expect(400, {
                            error: {
                                message: `Request body must contain either 'title', 'url', 'description', or 'rating.'`, 
                            }
                        })
                })

                it(`responds with 204 when updating only a subset of fields`, () => {
                    const idToUpdate = 2
                    const updateBookmark = {
                        title: 'updated bookmark title',
                    }
                    const expectedBookmark = {
                        ...testBookmarks[idToUpdate - 1], 
                        ...updateBookmark
                    } // second spread operator will override first

                    return supertest(app)
                        .patch(`/api/bookmarks/${idToUpdate}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .send({
                            ...updateBookmark, 
                            fieldToIgnore: 'should not be in GET response'
                        })
                        .expect(204)
                        .then(res =>
                            supertest(app)
                                .get(`/api/bookmarks/${idToUpdate}`)
                                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                                .expect(expectedBookmark)
                        )
                })
            }) 
        })

    })
})

