const {
  getContext,
  take,
  put
} = require('redux-saga/effects')
const _ = require('lodash')
const abi = require('web3-eth-abi')

const DAO_KITS = {
  '0x705Cd9a00b87Bb019a87beEB9a50334219aC4444': {
    name: 'Democracy',
    abi: {
      name: 'newInstance',
      constant: false,
      type: 'function',
      inputs: [{
        name: 'name',
        type: 'string'
      }, {
        name: 'holders',
        type: 'address[]'
      }, {
        name: 'tokens',
        type: 'uint256[]'
      }, {
        name: 'supportNeeded',
        type: 'uint64'
      }, {
        name: 'minAcceptanceQuorum',
        type: 'uint64'
      }, {
        name: 'voteDuration',
        type: 'uint64'
      }],
      outputs: []
    }
  },
  '0x41bbaf498226b68415f1C78ED541c45A18fd7696': {
    name: 'Multisig',
    abi: {
      name: 'newInstance',
      constant: false,
      type: 'function',
      inputs: [{
        name: 'name',
        type: 'string'
      }, {
        name: 'signers',
        type: 'address[]'
      }, {
        name: 'neededSignatures',
        type: 'uint256'
      }],
      outputs: []
    }
  }
}

module.exports = function * () {
  const web3 = yield getContext('web3')

  const kitAdresses = _.keys(DAO_KITS)
  while (true) {
    const { payload: transaction } = yield take('daolist/eth/TRANSACTION')

    // We only want transactions to DAO kits
    if (
      !kitAdresses.includes(transaction.to)
    ) continue

    const kit = DAO_KITS[transaction.to]
    const methodId = web3.eth.abi.encodeFunctionSignature(
      kit.abi
    )

    // We only want transactions with whitelisted method IDs
    if (
      transaction.input.slice(0, 10) !== methodId
    ) continue

    // Get the DAO name
    const { name } = abi.decodeParameters(
      kit.abi.inputs,
      '0x' + transaction.input.slice(10)
    )

    yield put({
      type: 'daolist/dao/DAO_CREATED',
      payload: {
        block: transaction.blockNumber,
        kit: transaction.to,
        creator: transaction.from,
        transaction: transaction.hash,
        name
      }
    })
  }
}