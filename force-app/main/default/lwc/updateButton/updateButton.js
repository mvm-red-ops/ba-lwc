import { LightningElement, api, track } from 'lwc';
import updateSchedules from '@salesforce/apex/TrafficUpdateFromBA_LWC.updateSchedules';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';



export default class UpdateButton extends LightningElement {
  
  updateSchedules(event){
    const updateEvent =new CustomEvent("updateschedules", {
      detail: 'event'
    });

    this.dispatchEvent(updateEvent)
  }

}