const scenarios = require('./mercury_client_scenarios')

tlib.TestTemplate.describeWithLib('mercury_client', () => {
  // We have some long-running tests
  jest.setTimeout(30000);

  test("allows a connection", async () => {
    await scenarios["connect_send_disconnect"]()
    expect(true)
  })

  test('broadcasts messages from one client to all other clients', async () => {
    const result = await scenarios["1_sender_2_receivers"]()
    result.messagesReceived.forEach((message) => {
      expect(message).toEqual(result.sentMessage)
    })
    expect(result.messagesReceived.length).toEqual(2)
  })

  test('communication between 2 clients', async () => {
    // Send copies of the arrays since we want to check the results against them
    const result = await scenarios["2_peers_back_and_forth"]()
    const messages1 = result.messagesSent1
    const messages2 = result.messagesSent2
    const expectedSequence =[
      messages1[0], messages2[0],
      messages1[1], messages2[1],
      messages1[2], messages2[2],
      messages1[3], messages2[3],
    ]
    expect(result.messagesReceived1).toEqual(messages2)
    expect(result.messagesReceived2).toEqual(messages1)
    expect(result.sequence).toEqual(expectedSequence)
  })
})
