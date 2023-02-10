/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

import { Ws } from '@kastelll/packages'
import { Identify } from '../Events/Identify';

// Below are all the events we import
// example: import Heartbeat from './client/heartbeat'
// then we add it to the EventsHandler class 
// new Heartbeat()

export default class Init {
    constructor() {}

    public create() {
      return new Ws.EventsHandler(
        // V1 Below
        new Identify(),
        // V1 Ends Here
      )
    }

}