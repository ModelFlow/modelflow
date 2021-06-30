import React, { Component } from 'react';
import './DefaultAttributeForms.css';
import { connect } from 'react-redux';
import actions from '../../state/actions';
import {
  AnchorButton,
  ButtonGroup,
  Button,
  Classes,
  Dialog,
  Intent,
  InputGroup,
  FormGroup,
  Checkbox,
  Tooltip,
  MenuItem,
  TextArea,
  Navbar,
  NavbarDivider,
  NavbarGroup,
  NavbarHeading,
  Alignment,
  Menu,
  MenuDivider,
  H5,
} from '@blueprintjs/core';
import { appendItem } from '../../services/Utilities.js';

class DefaultAttributeForms extends Component {
  render() {
    console.log('inside render default attribute forms');
    // TODO: Make the runstep function an actual code editor
    /*
    key = models.CharField(max_length=120)
    label = models.CharField(max_length=120, null=True, blank=True)
    kind = models.CharField(default='param', choices=ATTRIBUTE_TYPES, max_length=6)
    units = models.CharField(max_length=64, null=True, blank=True)
    is_private = models.BooleanField(default=False, blank=True)
    value = models.CharField(max_length=64)
    dtype = models.CharField(max_length=32)  # Needed to convert the variety of data in attribute

    confidence = models.IntegerField(null=True, blank=True)

    notes = models.TextField(null=True, blank=True)
    source = models.TextField(null=True, blank=True)

    model_class = models.ForeignKey('ModelClass', on_delete=models.SET_NULL, null=True, related_name='default_attributes')

    */

    const {
      label,
      attrType,
      newDefaultAttribute,
      removeDefaultAttribute,
      updateDefaultAttributeField,
    } = this.props;

    const { [attrType]: attributes } = this.props;
    console.log('ATTRIBUTES');
    console.log(attributes);
    // return null;

    return (
      <>
        {attributes.map((item, idx) => {
          let isPrivateForm = null;
          if (attrType === 'states') {
            isPrivateForm = (
              <Checkbox
                checked={item.is_private}
                label="Is Private"
                onChange={() =>
                  updateDefaultAttributeField(
                    attrType,
                    idx,
                    'is_private',
                    !item.is_private,
                  )
                }
              />
            );
          }

          const valueLabel = attrType === 'states' ? 'Initial Val' : 'Value';
          return (
            <div className="DefaultAttributeCard" key={idx}>
              <FormGroup
                label="Key"
                labelInfo="(required) What you refer to in code"
              >
                <InputGroup
                  placeholder="key"
                  value={item.key}
                  onChange={(e) =>
                    updateDefaultAttributeField(
                      attrType,
                      idx,
                      'key',
                      e.target.value,
                    )
                  }
                />
              </FormGroup>

              <FormGroup
                label="Label"
                labelInfo="(required) Nice human readable label"
              >
                <InputGroup
                  placeholder="label"
                  value={item.label}
                  onChange={(e) =>
                    updateDefaultAttributeField(
                      attrType,
                      idx,
                      'label',
                      e.target.value,
                    )
                  }
                />
              </FormGroup>

              <div className="DefaultAttrFlex">
                <FormGroup label="Data Type" labelInfo="(required)">
                  <InputGroup
                    placeholder="Data Type"
                    value={item.dtype}
                    onChange={(e) =>
                      updateDefaultAttributeField(
                        attrType,
                        idx,
                        'dtype',
                        e.target.value,
                      )
                    }
                  />
                </FormGroup>

                <FormGroup label={valueLabel} labelInfo="(required)">
                  <InputGroup
                    placeholder={valueLabel}
                    value={item.value}
                    onChange={(e) =>
                      updateDefaultAttributeField(
                        attrType,
                        idx,
                        'value',
                        e.target.value,
                      )
                    }
                  />
                </FormGroup>

                <FormGroup label="Units" labelInfo="(required)">
                  <InputGroup
                    placeholder="Units"
                    value={item.units}
                    onChange={(e) =>
                      updateDefaultAttributeField(
                        attrType,
                        idx,
                        'units',
                        e.target.value,
                      )
                    }
                  />
                </FormGroup>
              </div>

              <FormGroup label="Source">
                <InputGroup
                  placeholder="Source"
                  value={item.source}
                  onChange={(e) =>
                    updateDefaultAttributeField(
                      attrType,
                      idx,
                      'source',
                      e.target.value,
                    )
                  }
                />
              </FormGroup>

              <FormGroup label="Notes">
                <InputGroup
                  placeholder="Notes"
                  value={item.notes}
                  onChange={(e) =>
                    updateDefaultAttributeField(
                      attrType,
                      idx,
                      'notes',
                      e.target.value,
                    )
                  }
                />
              </FormGroup>

              <Button onClick={() => removeDefaultAttribute(attrType, idx)}>
                Remove
              </Button>
            </div>
          );
        })}
        <div className="defaultAttributeFormAddDiv">
          <Button
            onClick={() => newDefaultAttribute(attrType)}
            className="defaultAttributeFormAddButton"
          >
            Add {label}
          </Button>
        </div>
      </>
    );
  }
}

const mapDispatchToProps = {
  newDefaultAttribute: actions.modelClassForm.newDefaultAttribute,
  removeDefaultAttribute: actions.modelClassForm.removeDefaultAttribute,
  updateDefaultAttributeField:
    actions.modelClassForm.updateDefaultAttributeField,
};

const mapStateToProps = (state) => ({
  states: state.modelClassForm.states,
  parameters: state.modelClassForm.parameters,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DefaultAttributeForms);
