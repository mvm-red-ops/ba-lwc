import { LightningElement, api } from 'lwc';

export default class SectionTile extends LightningElement {
	@api section;
  
  handleOpenRecordClick() {
    const selectEvent = new CustomEvent('sectionview', {
      detail: this.section.Id
    });
    this.dispatchEvent(selectEvent);
  }
}