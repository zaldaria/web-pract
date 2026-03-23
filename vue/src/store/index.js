import { createStore } from 'vuex'

const MUTATIONS = {
  ADD_BUBBLE: 'ADD_BUBBLE',
  REMOVE_BUBBLE: 'REMOVE_BUBBLE',
  CLEAR_BUBBLES: 'CLEAR_BUBBLES',
  UPDATE_SCORE: 'UPDATE_SCORE',
  SET_SCORE: 'SET_SCORE',
}

export default createStore({
  state() {
    return {
      bubbles: [],
      score: 0
    }
  },
  getters: {
    getBubbles: (state) => state.bubbles,
    getScore: (state) => state.score,
  },
  mutations: {
    [MUTATIONS.ADD_BUBBLE]: (state, bubble) => {
      state.bubbles.push(bubble)
    },
    [MUTATIONS.REMOVE_BUBBLE]: (state, id) => {
      const index = state.bubbles.findIndex(b => b.bubbleId === id)
      if (index !== -1) {
        state.bubbles.splice(index, 1)
      }
    },
    [MUTATIONS.CLEAR_BUBBLES]: (state) => {
      state.bubbles = []
    },
    [MUTATIONS.UPDATE_SCORE]: (state, value) => {
      state.score += value
    },
    [MUTATIONS.SET_SCORE]: (state, value) => {
      state.score = value
    },
  },
  actions: {
    addBubble: (store, bubble) => {
      store.commit(MUTATIONS.ADD_BUBBLE, bubble)
    },
    removeBubble: (store, id) => {
      store.commit(MUTATIONS.REMOVE_BUBBLE, id)
    },
    clearBubbles: (store) => {
      store.commit(MUTATIONS.CLEAR_BUBBLES)
    },
    updateScore: (store, value) => {
      store.commit(MUTATIONS.UPDATE_SCORE, value)
    },
    setScore: (store, value) => {
      store.commit(MUTATIONS.SET_SCORE, value)
    }
  }
})