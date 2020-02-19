import { LightningElement, track } from 'lwc';

export default class App extends LightningElement {
    @track sessionId;
    handleNavigate(event) {
        this.sessionId = event.detail;
    }
}
