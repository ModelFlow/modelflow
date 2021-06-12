import React, { Component, useRef, useState } from 'react';
import './ModelClass.css';
import { connect } from 'react-redux';
import actions from '../../state/actions';
import DefaultAttributeForms from '../DefaultAttributeForms/DefaultAttributeForms.jsx';
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
import Editor from '@monaco-editor/react';

class ModelClass extends Component {
  /*
  editorRef = useRef(null);

  handleEditorDidMount(editor, monaco) {
    this.editorRef.current = editor;
  }

  showValue() {
    alert(this.editorRef.current.getValue());
  }
            onMount={this.handleEditorDidMount}

  */

  // const[isEditorReady, setIsEditorReady] = useState(false);
  // const valueGetter = useRef();

  // handleEditorDidMount(_valueGetter) {
  //   setIsEditorReady(true);
  //   valueGetter.current = _valueGetter;
  // }

  // handleShowValue() {
  //   alert(valueGetter.current());
  // }

  render() {
    /*
    key = models.CharField(max_length=120)
    label = models.CharField(max_length=120, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    # TODO: handle imports
    run_step_code  = models.TextField(null=True, blank=True)
    is_hidden = models.BooleanField(default=False, blank=True)
    project = models.ForeignKey('Project', on_delete=models.SET_NULL, null=True)
    */

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

    const { name, description, updateModelClassField } = this.props;

    /*
        <MonacoEditor
          style={{ height: 500 }}
          language="html"
          value="<h1>I ♥ react-monacoeditor</h1>"
          options={{
            theme: 'vs-dark',
          }}
        />
  
                <FormGroup
          label="Run Step Function"
          labelFor="code-input"
          labelInfo="(required)"
        >
          <TextArea
            id="code-input"
            growVertically={true}
            fill={true}
            intent={Intent.PRIMARY}
            onChange={(e) => updateModelClassField('code', e.target.value)}
            value={code}
          />
        </FormGroup>
  
    */

    return (
      <div className="ModelClassForm">
        <FormGroup label="Name" labelFor="name-input" labelInfo="(required)">
          <InputGroup
            id="name-input"
            placeholder="Name"
            value={name}
            onChange={(e) => updateModelClassField('name', e.target.value)}
          />
        </FormGroup>

        <FormGroup label="Description" labelFor="description-input">
          <TextArea
            id="description-input"
            fill={true}
            growVertically={true}
            onChange={(e) =>
              updateModelClassField('description', e.target.value)
            }
            value={description}
          />
        </FormGroup>

        <H5>Parameter Constants</H5>
        <p>These attributes do not change overtime</p>
        <DefaultAttributeForms attrType="parameters" label="Constant" />

        <H5>States</H5>
        <p>These attributes may change every step</p>
        <DefaultAttributeForms attrType="states" label="State" />

        <H5>Run Step Function</H5>
        <Editor
          options={{
            minimap: {
              enabled: false,
            },
          }}
          height="300px"
          // theme='vs-dark'
          line={2}
          onChange={(x) => updateModelClassField('code', x)}
          defaultLanguage="python"
          defaultValue={`def run_step(states, params, utils):
    `}
        />
      </div>
    );
  }
}

const mapDispatchToProps = {
  submitModelClass: actions.modelClassForm.submitModelClass,
  updateModelClassField: actions.modelClassForm.updateModelClassField,
};

const mapStateToProps = (state) => ({
  name: state.modelClassForm.name,
  description: state.modelClassForm.description,
  code: state.modelClassForm.code,
});

export default connect(mapStateToProps, mapDispatchToProps)(ModelClass);
