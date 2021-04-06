import { LightningElement, api, track } from 'lwc';



export default class UpdateButton extends LightningElement {
  
  updateSchedules(event){
    const updateEvent =new CustomEvent("updateschedules", {
      detail: 'event'
    });

    this.dispatchEvent(updateEvent)
  }

}