/* Copyright 2016 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
import {PolymerElement, html} from '@polymer/polymer';
import {customElement, property} from '@polymer/decorators';

import {LegacyElementMixin} from '../../../components/polymer/legacy_element_mixin';
import '../../../components/polymer/irons_and_papers';

import {PointMetadata} from './data';

@customElement('vz-projector-metadata-card')
class MetadataCard extends LegacyElementMixin(PolymerElement) {
  static readonly template = html`
    <style>
      #metadata-card {
        background-color: rgba(255, 255, 255, 0.9);
        box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
          0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2);
        width: 200px;
      }

      #header {
        background: #e9e9e9;
      }

      #icon-container {
        position: absolute;
        right: 0;
        top: 4px;
      }

      #metadata-label {
        font-weight: 400;
        font-size: 14px;
        line-height: 24px;
        padding: 12px 12px 8px;
        width: 230px;
        overflow-wrap: break-word;
      }

      #metadata-table {
        display: table;
        padding: 8px 12px 4px;
      }

      .metadata-row {
        display: table-row;
      }

      .metadata-key {
        font-weight: bold;
      }

      .metadata-key,
      .metadata-value {
        display: table-cell;
        font-size: 12px;
        padding: 3px 3px;
      }
      .img-container{
        margin-left: 10px;
        padding-bottom: 10px;
      }

      .metadata-value {
        word-wrap: anywhere; /* Firefox only -- word-wrap DNE in Chrome. anywhere DNE in Chrome */
        word-break: break-word; /* break-word DNE in Firefox */
      }
    </style>

    <template is="dom-if" if="[[hasMetadata]]">
      <div id="metadata-card">
        <div id="icon-container">
          <paper-icon-button
            icon="[[collapseIcon]]"
            on-tap="_toggleMetadataContainer"
          >
          </paper-icon-button>
        </div>
        <div id="header">
          <div id="metadata-label">[[label]]</div>
        </div>
        <iron-collapse id="metadata-container" opened>
          <div id="metadata-table">
            <template is="dom-repeat" items="[[metadata]]">
              <div class="metadata-row">
                <div class="metadata-key">[[item.key]]</div>
                <div class="metadata-value">[[item.value]]</div>
              </div>
            </template>
          </div>
          <div class="img-container">
          <img id="metaImg" height="100px"/>
          </div>
        </iron-collapse>
      </div>
    </template>
  `;

  @property({type: Boolean})
  hasMetadata: boolean = false;

  @property({type: Boolean})
  isCollapsed: boolean = false;

  @property({type: String})
  collapseIcon: string = 'expand-less';

  @property({type: Array})
  metadata: Array<{
    key: string;
    value: string;
  }>;

  @property({type: String})
  label: string;

  private labelOption: string;
  private pointMetadata: PointMetadata;
  private resultImg: HTMLElement;
  
  /** Handles toggle of metadata-container. */
  _toggleMetadataContainer() {
    (this.$$('#metadata-container') as any).toggle();
    this.isCollapsed = !this.isCollapsed;
    this.set('collapseIcon', this.isCollapsed ? 'expand-more' : 'expand-less');
  }
  updateMetadata(pointMetadata?: PointMetadata, src?:string) {
    this.pointMetadata = pointMetadata;
    this.hasMetadata = pointMetadata != null;
    if (pointMetadata) {
      let metadata = [];
      for (let metadataKey in pointMetadata) {
        if (!pointMetadata.hasOwnProperty(metadataKey)) {
          continue;
        }
        metadata.push({key: metadataKey, value: pointMetadata[metadataKey]});
      }
      this.metadata = metadata;
      this.label = '' + this.pointMetadata[this.labelOption];
      //img
      setTimeout(()=>{
        this.resultImg = this.$$('#metaImg') as HTMLAnchorElement;
        console.log('outtt',src,this.resultImg)
        if(src?.length){
          this.resultImg?.setAttribute("style","display:block;")
          this.resultImg?.setAttribute('src',src)
        } else{
          this.resultImg?.setAttribute("style","display:none;")
        }
      },100)
    }
  }
  setLabelOption(labelOption: string) {
    this.labelOption = labelOption;
    if (this.pointMetadata) {
      this.label = '' + this.pointMetadata[this.labelOption];
    }
  }
}