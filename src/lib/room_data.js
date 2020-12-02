const RoomDynamo = require("./room_data/room_dynamo")

class RoomData {
  constructor() {
    this.dynamo = new RoomDynamo()
  }

  async init() {
    await this.dynamo.init()
  }

  async getRoomData(roomId) {
    const room = {}
    room.widgets = await this.getWidgetsInRoom(roomId)
    room.id = roomId
    room.state = {}
    return room
  }

  async getWidgetsInRoom(roomId) {
    roomId = parseInt(roomId)
    const widgets = await shared.db.pg.massive.query(`
      SELECT
        widgets.id AS id, widgets._type as type
      FROM
        widgets JOIN room_widgets ON widgets.id = room_widgets.widget_id
      WHERE
        room_widgets.room_id = $1
        AND
        widgets.deleted_at IS NULL
        AND
        widgets.archived_at IS NULL
    `, [roomId])
    return await this.dynamo.populateWidgetData(widgets, roomId)
  }

  async addWidget(widgetId, roomId, data, state) {
    return Promise.all([
      this.dynamo.setWidgetData(widgetId, data),
      this.dynamo.setRoomWidgetState(widgetId, roomId, state)
    ])
  }

  async eraseWidget(widgetId) {
    widgetId = parseInt(widgetId)
    const roomIdEntries = await shared.db.pg.massive.query(`
      SELECT room_id FROM room_widgets WHERE widget_id = $1
    `, [widgetId])
    const roomIds = roomIdEntries.map((r) => (r.room_id))
    await shared.db.pg.massive.query(`
      DELETE FROM widgets WHERE id = $1
    `, [widgetId])
    await shared.db.pg.massive.query(`
      DELETE FROM room_widgets WHERE widget_id = $1
    `, [widgetId])
    return this.dynamo.deleteWidget(roomIds, widgetId)
  }

  async updateWidgetData(widgetId, data) {

  }

  async updateWidgetState(widgetId, state) {

  }

}

module.exports = RoomData
