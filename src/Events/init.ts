import { Ws } from '@kastelll/packages'

// Below are all the events we import
// example: import Heartbeat from './client/heartbeat'
// then we add it to the EventsHandler class 
// new Heartbeat()

export default class Init {
    constructor() {}

    public create() {
      return new Ws.EventsHandler(

      )
    }

}