import { call, all } from 'cofx'
import { safeUpsert } from '../db'

export function * persist (
  ctx,
  trace
) {
  const getApp = (address) => {
    return ctx.db.collection('orgs')
      .find({
        'apps.address': ctx.web3.utils.toChecksumAddress(address)
      })
      .limit(1)
      .map(({ apps }) => apps)
      .next()
  }

  // Find every app and organization mentioned in this trace
  const appsInTrace = (yield all(trace.actions.map(
    (action) => call(getApp, action.to)
  ))).filter((res) => res !== null)

  // Find actions in the trace that are to known apps
  const actions = trace.actions.filter((action) => {
    return !!appsInTrace.find(
      (app) => app.address === action.to
    )
  }).map((action) => ({
    from: action.from,
    to: action.to,
    data: action.input
  }))

  // This was not a transaction sent to an app
  if (actions.length === 0) return

  // Parse trace actions
  const activity = {
    transactionHash: trace.transactionHash,
    timestamp: trace.timestamp,
    actions
  }

  ctx.log.info({
    transactionHash: activity.transactionHash,
    timestamp: activity.timestamp
  }, 'Activity logged.')

  // Persist activity
  yield call(
    safeUpsert,
    ctx.db.collection('activity'),
    { transactionHash: activity.transactionHash },
    {
      $set: activity
    }
  )
}
