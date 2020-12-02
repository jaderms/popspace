module.exports = {
  describeWithLib: (name, handler) => {
    describe(name, () => {
      beforeAll(async () => {
        await lib.init()
        await shared.db.pg.silenceLogs()
      })
      afterAll(async () => {
        return lib.cleanup()
      })
      return handler()
    })
  },
  testServerClients: (nClients, lambda) => {
    return async () => {
      let result = null
      const { clients, mercury } = await tlib.util.serverWithClients(nClients)
      try {
        result = await lambda(clients, mercury)
      } finally {
        await mercury.stop()
      }
      return result
    }
  },
  authenticatedUser: (lambda) => {
    return tlib.TestTemplate.testServerClients(1, async (clients, mercury) => {
      const testEnvironment = new tlib.TestEnvironment()
      const client = clients[0]
      const environmentUser = await testEnvironment.createLoggedInUser(client)
      await testEnvironment.authenticate(environmentUser)
      return await lambda(testEnvironment, mercury)
    })
  }
}
