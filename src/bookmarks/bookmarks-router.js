const express = require('express')
const { v4: uuid } = require('uuid')
const logger = require('../logger')
const { bookmarks } = require('../store')
const BookmarksService = require('../bookmarks-service')
const app = require('../app')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

bookmarksRouter
    .route('/api/bookmarks')
    .get((req, res) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res.json(bookmarks)
            })
            // .catch(next) *not working
        // res.json(bookmarks)
    })

    .post(bodyParser, (req, res, next) => {
        const { title, url, rating, description } = req.body

        if (!title) {
            logger.error('Title is required')
            return res 
                .status(400)
                .json({
                    error: { message: `Missing 'title' in request body` }
                })
                // .send('Invalid data')
        }

        if (!url) {
            logger.error('Url is required')
            return res 
                .status(400)
                .json({
                    error: { message: `Missing 'url' in request body` }
                })
                // .send('Invalid data')
        }

        if (!rating) {
            logger.error('Rating is required')
            return res 
                .status(400)
                .send('Invalid data')
        }

        if (!description) {
            logger.error('Description is required')
            return res 
                .status(400)
                .send('Invalid data')
        }

        // const id = uuid()

        const knexInstance = req.app.get('db')

        const newBookmark = {
            title, 
            url, 
            description, 
            rating
            // id: "12"
        }

        // bookmarks.push(newBookmark)

        // logger.info(`Bookmark with id: ${id} created`)

        BookmarksService.insertBookmark(
            knexInstance, newBookmark
        )
        .then(bookmark => {
            res
                .status(201)
                .location(`/api/bookmarks/${bookmark.id}`)
                //.location(req.originalUrl + `/${article.id}`)
                .json(bookmark)
        })
        .catch(next)

        /*
        res
            .status(201)
            .location(`http://localhost:8000/bookmarks/${id}`)
            .json(newBookmark) */
    })

bookmarksRouter
    .route('/api/bookmarks/:bookmark_id')
    
    /*
    .get((req, res) => {
        const { id } = req.params
        const bookmark = bookmarks.find(b => b.id === id)
        console.log(bookmark)
        if (!bookmark) {
            logger.error(`Bookmark with id of ${id} not found`)
            return res  
                .status(404)
                .send('Bookmark not found')
        }

        res.json(bookmark)
    }) */
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getById(knexInstance, req.params.bookmark_id)
            .then(bookmark => {
                res.json(bookmark)
            })
            .catch(next)
    })
    .delete((req, res) => {
        /*
        const { id } = req.params

        const bookmarkIndex = bookmarks.findIndex(b => b.id == id)

        if (bookmarkIndex === -1) {
            logger.error(`Bookmark with id: ${id} not found`)
            return res
                .status(404)
                .send('Not found')
        }

        bookmarks.splice(bookmarkIndex, 1)

        logger.info(`Bookmark with id: ${id} deleted`)
        
        res
            .status(204)
            .end() */
        const knexInstance = req.app.get('db')
        BookmarksService.deleteBookmark(
            knexInstance, req.params.bookmark_id
        )
        .then (bookmark => {
            if (!bookmark) {
                return res.status(404).json({
                    error: { message: `Bookmark doesn't exist` }
                })
            }
        })
        .then(() => {
            res.status(204).end()
        })
        // .catch(next)
    })
    .patch(bodyParser, (req, res, next) => {
        const { title, url, description, rating } = req.body
        const bookmarkToUpdate = { title, url, description, rating }

        const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length // Object.values generates array of values of the object, .filter(boolean) removes any value that is undefined
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain either 'title', 'url', 'description', or 'rating.'`
                }
            })
        }
        const knexInstance = req.app.get('db')
        BookmarksService.getById(knexInstance, req.params.bookmark_id)
            .then(bookmark => {
                console.log(bookmark + 'any message')
                if (!bookmark) {
                    return res.status(404).json({
                      error: { message: `Bookmark doesn't exist` }
                    })
                }
        
            BookmarksService.updateBookmark(
            knexInstance, 
            req.params.bookmark_id, 
            bookmarkToUpdate
        )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
            })
            .catch(next)

            // .catch(next) sends to error handling middleware
        
            /*
        const knexInstance = req.app.get('db')
        BookmarksService.updateBookmark(
            knexInstance, 
            req.params.bookmark_id, 
            bookmarkToUpdate
        )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next) */
    })

module.exports = bookmarksRouter