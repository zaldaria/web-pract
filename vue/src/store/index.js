import { createStore } from 'vuex'

const MUTATIONS = {
  ADD_BUBBLE: 'ADD_BUBBLE',
  REMOVE_BUBBLE: 'REMOVE_BUBBLE',
  CLEAR_BUBBLES: 'CLEAR_BUBBLES',
  UPDATE_SCORE: 'UPDATE_SCORE',
  SET_SCORE: 'SET_SCORE',
  SET_HIT_MULTIPLIER: 'SET_HIT_MULTIPLIER',
  SET_MISS_MULTIPLIER: 'SET_MISS_MULTIPLIER',
  ADD_BOMB: 'ADD_BOMB',
  USE_BOMB: 'USE_BOMB',
  INCREMENT_HIT_STREAK: 'INCREMENT_HIT_STREAK',
  RESET_HIT_STREAK: 'RESET_HIT_STREAK',
}

export default createStore({
  state() {
    return {
      bubbles: [],
      score: 0,
      hitMultiplier: 1.0,
      missMultiplier: 1.0,
      bombs: 0,
      hitStreak: 0
    }
  },
  getters: {
    getBubbles: (state) => state.bubbles,
    getScore: (state) => Math.round(state.score),
    getHitMultiplier: (state) => state.hitMultiplier,
    getMissMultiplier: (state) => state.missMultiplier,
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
    [MUTATIONS.SET_HIT_MULTIPLIER]: (state, value) => {
      state.hitMultiplier = value
    },
    [MUTATIONS.SET_MISS_MULTIPLIER]: (state, value) => {
      state.missMultiplier = value
    },
    [MUTATIONS.ADD_BOMB]: (state) => {
      state.bombs++
    },
    [MUTATIONS.USE_BOMB]: (state) => {
      if (state.bombs > 0) state.bombs--
    },
    [MUTATIONS.INCREMENT_HIT_STREAK]: (state) => {
      state.hitStreak++
      if (state.hitStreak >= 10) {
        state.bombs++
        state.hitStreak = 0
      }
    },
    [MUTATIONS.RESET_HIT_STREAK]: (state) => {
      state.hitStreak = 0
    }
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
    },
    setMultipliers: (store) => {
      store.commit(MUTATIONS.SET_MISS_MULTIPLIER, 1.0)
      store.commit(MUTATIONS.SET_HIT_MULTIPLIER, 1.0)
    },
    processScore({ commit, state }, { isCorrect, size, basePoints, baseFine }) {
      if (isCorrect) {
        commit('INCREMENT_HIT_STREAK')

        const earnedPoints = basePoints * state.hitMultiplier
        commit('UPDATE_SCORE', earnedPoints)

        const newHit = Math.min(5, state.hitMultiplier * 1.2)
        commit('SET_HIT_MULTIPLIER', newHit)

        commit('SET_MISS_MULTIPLIER', 1.0)

        return { newMultiplier: newHit, type: 'hit' }

      } else {
        commit('RESET_HIT_STREAK')

        let penaltyBase = 0

        if (size === 'big') {
          penaltyBase = baseFine
        } else if (size === 'medium') {
          penaltyBase = baseFine - 2
        } else {
          penaltyBase = baseFine - 4
        }

        const lostPoints = penaltyBase * state.missMultiplier
        commit('UPDATE_SCORE', -lostPoints)

        const newMiss = Math.min(7, state.missMultiplier * 1.3)
        commit('SET_MISS_MULTIPLIER', newMiss)

        commit('SET_HIT_MULTIPLIER', 1.0)

        return { newMultiplier: newMiss, type: 'miss' }
      }
    },
  }
})