const path = require('path')
const express = require('express')
const xss = require('xss')
const QuestionsService = require('./questions-service')

const questionsRouter = express.Router()
const jsonParser = express.json()

const serializeQuestions = questions => ({
  id: questions.id,
  board_id: questions.board_id,
  question_text: xss(questions.question_text),
  question_answer: xss(questions.question_answer),
  question_category: questions.question_category
})

questionsRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    QuestionsService.getQuestions(knexInstance)
      .then(questions => {
        res.json(questions.map(serializeQuestions))
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { board_id,
      question_text,
      question_answer,
      question_category
    } = req.body
    const newQuestion = {
      board_id,
      question_text,
      question_answer,
      question_category
    }
    for (const [key, value] of Object.entries(newQuestion))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })

    QuestionsService.insertQuestions(
      req.app.get('db'),
      newQuestion
    )
      .then(questions => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/questions/${questions.id}`))
          .json(serializeQuestions(questions))
      })
      .catch(next)
  })
  .all((req, res, next) => {
    if (isNaN(parseInt(req.params.questions_id))) {
      return res.status(404).json({
        error: { message: `Invalid id` }
      })
    }
    QuestionsService.getQuestionsById(
      req.app.get('db'),
      req.params.questions_id
    )
      .then(questions => {
        if (!questions) {
          return res.status(404).json({
            error: { message: `question doesn't exist` }
          })
        }
        res.questions = questions
        next()
      })
      .catch(next)
  })

questionsRouter
  .route('/:question_id')
  .get((req, res, next) => {
    res.json(serializeQuestions(res.questions))
  })
  .delete((req, res, next) => {
    QuestionsService.deleteQuestions(
      req.app.get('db'),
      req.params.questions_id
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const { question_text,
      question_answer } = req.body
    const questionsToUpdate = { question_text,
      question_answer }

    const numberOfValues = Object.values(questionsToUpdate).filter(Boolean).length
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must content either 'title' or 'completed'`
        }
      })

    QuestionsService.updateQuestions(
      req.app.get('db'),
      req.params.questions_id,
      questionsToUpdate
    )
      .then(updatedquestions => {
        res.status(200).json(serializeQuestions(updatedquestions[0]))
      })
      .catch(next)
  })

module.exports = questionsRouter