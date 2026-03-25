<template>
  <div class="bubble-game">
    <header class="bubble-game__header header-panel">
      <div>
        <div class="header-panel__score">
          <span>Score: {{ score }}</span>

          <div class="header-panel__selection-group">
            <span>Select: </span>
            <div class="header-panel__color"
                 :style="{ backgroundColor : colorMap[selectColor] || colorMap.default }">
            </div>
          </div>

          <div class="header-panel__multipliers">
            <span class="header-panel__multipliers--hit">Hit: x{{ hitMultiplier.toFixed(1) }}</span>
            <span class="header-panel__multipliers--miss">Miss: x{{ missMultiplier.toFixed(1) }}</span>
          </div>

          <div class="header-panel__bombs">
            <span>Bombs: {{ bombsCount }} ({{ hitStreak }}/10)</span>
            <button
                class="header-panel__bomb-btn"
                :class="{'header-panel__bomb-btn--active': isBombMode }"
                @click="toggleBombMode"
                :disabled="bombsCount === 0">
              Use Bomb
            </button>
          </div>

        </div>
      </div>
      <div>
        <button class="c-button" @click="() => restartGame()">Restart</button>
      </div>
    </header>

    <main class="bubble-game__field"
          @mousedown="(e) => handleFieldClick(e)">
      <Bubble
          v-for="b in activeBubbles"
          :key="b.bubbleId"
          ref="bubble"
          :bubbleId="b.bubbleId"
          :color="colorMap[b.color] || colorMap.default"
          :size="b.size"
          :initialX="b.initialX || 0"
          :initialY="b.initialY || 0"
          :amplitude="b.amplitude"
          :offset="b.offset"
          @pop="(data) => handleBubblePop(data)"
          @expired="(id) => handleExpiredBubble(id)"
      />

      <div v-for="text in scoreCoefficients"
           :key="text.id"
           class="coefficients-text"
           :class="'coefficients-text--' + text.type"
           :style="{ left: text.x + 'px', top: text.y + 'px' }">
        x{{ text.value.toFixed(1) }}
      </div>

    </main>
  </div>
</template>

<script>
import Bubble from "@/components/ui/Bubble.vue"

export default {
  name: "BubbleGame",
  components: {Bubble},
  emits: ['finish'],
  props: {
    numberOfColors: {
      default: 2,
      type: Number
    },
    selectColor: {
      default: 'default',
      type: String
    },
    intensity: {
      default: 1,
      type: Number
    },
    points: {
      default: 1,
      type: Number
    },
    fine: {
      default: 5,
      type: Number
    },
  },
  data() {
    return {
      spawnTimer: null,
      colorMap: {
        blue: '#0879ea',
        breeze: '#06b8a2',
        purple: '#7506dc',
        pink: '#ad39ba',
        default: '#7cafe3'
      },
      sizes: ['small', 'medium', 'big'],
      scoreCoefficients: [],
      isBombMode: false,
    };
  },
  computed: {
    activeBubbles() {
      return this.$store.getters.getBubbles
    },
    score() {
      return this.$store.getters.getScore
    },
    interval() {
      return 1000 / this.intensity
    },
    hitMultiplier() {
      return this.$store.getters.getHitMultiplier || 1
    },
    missMultiplier() {
      return this.$store.getters.getMissMultiplier || 1
    },
    bombsCount() {
      return this.$store.state.bombs
    },
    hitStreak() {
      return this.$store.state.hitStreak
    }
  },
  methods: {
    initGame() {
      this.stopSpawning()
      this.$store.dispatch('setMultipliers')
      this.$store.dispatch('setScore', 0)
      this.$store.dispatch('clearBubbles')
      this.addBubble()
      this.startSpawning()
    },
    startSpawning() {
      this.spawnTimer = setInterval(() => {
        this.addBubble()
      }, this.interval)
    },
    stopSpawning() {
      if (this.spawnTimer) {
        clearInterval(this.spawnTimer)
        this.spawnTimer = null
      }
    },
    addBubble() {
      const colors = Object.keys(this.colorMap)
      const fieldWidth = window.innerWidth

      const newBubble = {
        bubbleId: Date.now() + Math.random(),
        color: colors[Math.floor(Math.random() * this.numberOfColors)],
        size: this.sizes[Math.floor(Math.random() * this.sizes.length)],
        amplitude: Math.floor(Math.random() * 50) + 20,
        offset: Math.floor(Math.random() * 100),
        initialX: Math.floor(Math.random() * (fieldWidth - 220)) + 100,
        initialY: -75,
      }

      this.$store.dispatch('addBubble', newBubble)
    },
    checkScore() {
      if (this.score >= 1000 || this.score <= -1000) {
        this.stopSpawning()
        this.$emit('finish', this.score)
      }
    },
    restartGame() {
      this.initGame()
    },
    handleBubblePop(data) {
      const { id, x, y, size, color } = data

      const targetColor = this.colorMap[this.selectColor] || this.colorMap.default
      const isCorrect = color === targetColor

      const scorePayload = {
        isCorrect: isCorrect,
        size: size,
        basePoints: this.points,
        baseFine: this.fine
      };

      this.$store.dispatch('processScore', scorePayload).then((result) =>{
        this.showCoefficientsText(x, y, result.newMultiplier, result.type)
      })

      const parentColorKey = Object.keys(this.colorMap).find(key => this.colorMap[key] === data.color)

      if (size === 'big') {
        this.spawnSplits(parentColorKey, 3, 'medium', x, y)
      } else if (size === 'medium') {
        this.spawnSplits(parentColorKey, 5, 'small', x, y)
      }

      if (this.$refs.bubble) {
        this.$refs.bubble.forEach(bubble => {
          if (bubble.bubbleId !== id) {
            bubble.push(x, y, size)
          }
        })
      }
      this.$store.dispatch('removeBubble', id)
      this.checkScore()
    },
    showCoefficientsText(x, y, value, type) {
      const id = Date.now() + Math.random()
      this.scoreCoefficients.push({ id, x, y, value, type })
      setTimeout(() => {
        this.scoreCoefficients = this.scoreCoefficients.filter(t => t.id !== id)
      }, 1000)
    },
    handleExpiredBubble(bubbleId) {
      const id = this.activeBubbles.findIndex(b => b.bubbleId === bubbleId)
      if (id === -1) return
      const expiredBubble = this.activeBubbles[id]

      if (expiredBubble.color === this.selectColor) {
        let penalty = 0
        if (expiredBubble.size === 'big') {
          penalty = -(this.fine + 5)
        } else if (expiredBubble.size === 'medium') {
          penalty = -(this.fine + 1)
        } else {
          penalty = -(this.fine - 2)
        }
        this.$store.dispatch('updateScore', penalty)
        this.checkScore()
      }
      this.$store.dispatch('removeBubble', bubbleId)
    },
    spawnSplits(parentColor, count, newSize, currentX, currentY) {
      const colors = Object.keys(this.colorMap)
      const radius = 60

      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI) / count
        const offsetX = Math.cos(angle) * radius
        const offsetY = Math.sin(angle) * radius

        const colorKey = (i === 0) ? parentColor : colors[Math.floor(Math.random() * colors.length)]

        const newBubble = {
          bubbleId: Date.now() + Math.random(),
          color: colorKey,
          size: newSize,
          amplitude: 15,
          offset: Math.random() * 100,
          initialX: currentX + offsetX,
          initialY: currentY + offsetY,
        }

        this.$store.dispatch('addBubble', newBubble)
      }
    },
    toggleBombMode() {
      if (this.bombsCount > 0) {
        this.isBombMode = !this.isBombMode
      }
    },
    handleFieldClick(event) {
      if (!this.isBombMode || this.bombsCount <= 0) return

      const field = this.$el.querySelector('.bubble-game__field')
      const rect = field.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      const clickY = event.clientY - rect.top

      this.triggerExplosion(clickX, clickY)

      this.$store.commit('USE_BOMB')
      this.isBombMode = false
    },
    triggerExplosion(x, y) {
      const currentBubbles = [...this.$store.getters.getBubbles]

      currentBubbles.forEach(b => {
        const bubbleComponent = this.$refs.bubble?.find(cmp => cmp.bubbleId === b.bubbleId)
        if (!bubbleComponent) return

        const currentX = bubbleComponent.x
        const currentY = bubbleComponent.y

        const dx = currentX - x
        const dy = currentY - y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance <= 150) {
          this.$store.commit('REMOVE_BUBBLE', b.bubbleId)

          if (b.size === 'big') {
            this.spawnSplits(b.color, 7, 'small', currentX, currentY)
          }
        }
      });
    },
  },
  beforeUnmount() {
    this.stopSpawning()
  },
  mounted() {
    this.initGame()
  }
}
</script>

<style lang="scss">
.bubble-game {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background-color: #f8f9fa;

  &__header {
    flex: 0 0 auto;
  }

  &__field {
    flex: 1 1 auto;
    position: relative;
    overflow: hidden;
    width: 100%;
  }
}

.header-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #f8f9fa;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  font-size: 20px;

  &__score {
    display: flex;
    align-items: center;
    gap: 30px;
    color: #0879ea;
  }

  &__group {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__color {
    display: inline-block;
    border-radius: 50%;
    width: 20px;
    height: 20px;
  }

  &__multipliers {
    display: flex;
    gap: 15px;

    &--hit {
      color: #4caf50;
    }

    &--miss {
      color: #f44336;
    }
  }

  &__bombs {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #000000;
  }

  &__bomb-btn {
    padding: 4px 12px;
    border: 1px solid #000000;
    border-radius: 6px;
    background-color: #f8f9fa;
    cursor: pointer;
    font-size: 20px;

    &:disabled {
      cursor: not-allowed;
      border-color: #a5a5a5;
      color: #a5a5a5;
    }

    &--active {
      outline: 3px solid #f44336;
    }
  }
}

.coefficients-text {
  position: absolute;
  font-size: 20px;
  pointer-events: none;
  z-index: 100;

  &--hit {
    color: #4caf50;
  }

  &--miss {
    color: #f44336;
  }
}

</style>