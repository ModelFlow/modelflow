import { insertItem, removeIdx, appendItem } from '../../services/Utilities';

const defaultResultGrid = {
  cards: {},
  layout: {
    lg: [],
  },
};

const initialState = {
  mainViewType: 'flow',
  simError: null,
  tabs: [
    {
      id: 'blank',
      name: 'Unnamed Tab',
    },
  ],
  xrange: [],
  selectedTabId: 'blank',
  selectedUUID: '',
  tabsContent: {
    blank: defaultResultGrid,
  },
};

export default function reduce(state = initialState, action = {}) {
  switch (action.type) {
    // case 'SET_SIM_ERROR': {
    //   return {
    //     ...state,
    //     simError: action.simError,
    //   };
    // }
    case 'UPDATE_TABS': {
      return {
        ...state,
        tabs: action.tabs,
        tabsContent: action.tabsContent,
        selectedTabId: action.selectedTabId,
      };
    }

    case 'SET_SELECTED_UUID': {
      return {
        ...state,
        selectedUUID: action.selectedUUID,
      };
    }

    case 'UPDATE_TABS_CONTENT': {
      return {
        ...state,
        tabsContent: action.tabsContent,
      };
    }

    case 'SET_XRANGE': {
      return {
        ...state,
        xrange: [...action.xrange], // Cool way to make a copy
      };
    }

    case 'UPDATE_RESULT_VIEW_LAYOUT': {
      const { selectedTabId } = state;
      return {
        ...state,
        tabsContent: {
          ...state.tabsContent,
          [selectedTabId]: {
            ...state.tabsContent[selectedTabId],
            layout: action.layout,
          },
        },
      };
    }
    case 'ADD_CARD': {
      const { selectedTabId } = state;
      console.log('🃏 Card type received in reducers/results_view: ' + action.card.cardType)
      console.log(action.card)
      
      return { 
        ...state,
        tabsContent: {
          ...state.tabsContent,
          [selectedTabId]: {
            cards: {
              ...state.tabsContent[selectedTabId].cards,
              [action.card.uuid]: action.card,
            },
            layout: {
              lg: insertItem(state.tabsContent[selectedTabId].layout.lg, {
                i: action.card.uuid,
                x: 0,
                y: 0,
                w: 6,
                h: 6,
                cardType: action.card.cardType /* make sure only added card gets cardType */
              }),
            },
          },
        },
      }  
    }
    case 'REMOVE_CARD': {
      const { uuid } = action;
      const { selectedTabId, tabsContent } = state;
      const { cards, layout } = tabsContent[selectedTabId];
      const { [uuid]: value, ...newCards } = cards;
      const toDeleteIdx = layout.lg.findIndex((x) => x.i === uuid);
      return {
        ...state,
        tabsContent: {
          ...state.tabsContent,
          [selectedTabId]: {
            cards: newCards,
            layout: {
              lg: removeIdx(layout.lg, toDeleteIdx),
            },
          },
        },
      };
    }
    case 'UPDATE_CARD_OUTPUT_KEY': {
      const { selectedTabId } = state;
      return {
        ...state,
        tabsContent: {
          ...state.tabsContent,
          [selectedTabId]: {
            ...state.tabsContent[selectedTabId],
            cards: {
              ...state.tabsContent[selectedTabId].cards,
              [action.uuid]: {
                outputKey: action.outputKey,

              },
            },
          },
        },
      };
    }

    case 'SWITCH_TAB': {
      return {
        ...state,
        selectedTabId: action.selectedTabId,
      };
    }

    case 'ADD_TAB': {
      return {
        ...state,
        tabs: appendItem(state.tabs, action.tab),
        tabsContent: {
          ...state.tabsContent,
          [action.tab.id]: defaultResultGrid,
        },
      };
    }

    case 'REMOVE_TAB': {
      const { tabs, selectedTabId } = state;
      const toDeleteIdx = tabs.findIndex((x) => x.id === action.id);
      const needToChangeSelected = tabs[toDeleteIdx].id === selectedTabId;
      const removedArr = removeIdx(tabs, toDeleteIdx);
      let newSelectedTabId = selectedTabId;
      if (needToChangeSelected) {
        newSelectedTabId = removedArr[0].id;
      }
      return {
        ...state,
        tabs: removedArr,
        selectedTabId: newSelectedTabId,
      };
    }

    case 'EDIT_TAB_NAME': {
      const newTabs = state.tabs.slice();
      const toEditIdx = newTabs.findIndex((x) => x.id === action.id);
      newTabs[toEditIdx].name = action.name;
      return {
        ...state,
        tabs: newTabs,
      };
    }
    default:
      return state;
  }
}
