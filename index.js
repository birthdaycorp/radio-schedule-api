const url = require('url')

const jwt = require('./lib/auth/jwt')
const calendars = require('./lib/calendars')

async function fetchEvents (date) {
  let events

  const propsToDelete = ['kind', 'etag', 'description', 'creator', 'organizer',
    'iCalUID', 'reminders', 'status', 'htmlLink', 'created', 'updated',
    'recurringEventId', 'sequence', 'originalStartTime']

  try {
    await calendars.auth(jwt)
  } catch (err) {
    err.statusCode = 400
    throw err
  }

  try {
    events = await calendars
      .getEvents(date.getFullYear(), date.getMonth() + 1)
  } catch (err) {
    err.statusCode = 400
    throw err
  }

  events.forEach((event) => {
    for (let i of propsToDelete) delete event[i]
  })
  return events
}

module.exports = async function (req, res) {
  let pathname, date, events, year, month, err

  // get query params from url
  pathname = url
    .parse(req.url)
    .pathname
    .split('/')
  if (pathname.length !== 3) {
    err = new Error('Include only month and year: e.g. "/2016/12"')
    err.statusCode = 400
    throw err
  }
  year = pathname[1]
  month = pathname[2]

  date = new Date(year, month - 1)

  if (isNaN(date.getTime())) {
    err = new Error('Not a date')
    err.statusCode = 400
    throw err
  }

  try {
    events = await fetchEvents(date)
  } catch (err) {
    err.statusCode = 400
    throw err
  }

  return events
}
