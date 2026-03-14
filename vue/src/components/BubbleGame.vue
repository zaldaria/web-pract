<template>
  <div class="bubble-game">
    <header class="bubble-game__header header-panel">
      <div>
        <div class="header-panel__score">
          <span class="header-panel__label">Score: {{ score }}</span>
          <div class="header-panel__selection-group">
            <span class="header-panel__label">Select: </span>
            <div class="header-panel__color"
                 :style="{ backgroundColor : colorMap[selectColor] || colorMap.default }">
            </div>
          </div>
        </div>
      </div>
      <div>
        <button class="c-button" @click="() => restartGame()">Restart</button>
      </div>
    </header>

    <main class="bubble-game__field">
      <Bubble
          v-for="(b, index) in activeBubbles"
          :key="b.id"
          ref="bubble"
          :index="index"
          :color="colorMap[b.color] || colorMap.default"
          :size="b.size"
          :initialX="b.initialX || 0"
          :initialY="b.initialY || 0"
          :amplitude="b.amplitude"
          :offset="b.offset"
          @mousedown.stop="() => handleBubblePop(b.id)"
          @expired="() => handleExpiredBubble(b.id)"
      />

    </main>
  </div>
</template>

<script>
import Bubble from "@/components/ui/Bubble.vue";
import {bus} from '@/eventBus'

export default {
  name: "BubbleGame",
  components: {Bubble},
  emits: ['finish'],
  props: {
    num: {
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
      score: 0,
      activeBubbles: [],
      spawnTimer: null,
      colorMap: {
        blue: '#0879ea',
        breeze: '#06b8a2',
        purple: '#7506dc',
        pink: '#ad39ba',
        default: '#7cafe3'
      },
      sizes: ['small', 'medium', 'big'],
    };
  },
  computed: {
    interval() {
      return 1000 / this.intensity
    }
  },
  methods: {
    initGame() {
      this.stopSpawning()
      this.score = 0
      this.activeBubbles = []
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
      const colors = Object.keys(this.colorMap);
      const fieldWidth = window.innerWidth

      this.activeBubbles.push({
        id: Date.now() + Math.random(),
        color: colors[Math.floor(Math.random() * this.num)],
        size: this.sizes[Math.floor(Math.random() * this.sizes.length)],
        amplitude: Math.floor(Math.random() * 50) + 20,
        offset: Math.floor(Math.random() * 100),
        initialX: Math.floor(Math.random() * (fieldWidth - 220)) + 100,
        initialY: -75,
      });
    },
    check() {
      if (this.score >= 50 || this.score <= -50) {
        this.stopSpawning()
        this.$emit('finish', this.score)
      }
    },
    restartGame() {
      this.initGame()
    },
    processScore(bubbleColorName, bubbleSize) {
      if (bubbleColorName === this.selectColor) {
        this.score += this.points
      } else {
        if (bubbleSize === 'big') {
          this.score -= this.fine
        } else if (bubbleSize === 'medium') {
          this.score -= this.fine - 2
        } else {
          this.score -= this.fine - 4
        }
      }
    },
    handleBubblePop(bubbleId) {
      const index = this.activeBubbles.findIndex(b => b.id === bubbleId)
      if (index === -1) return
      const poppedBubble = this.activeBubbles[index]

      const { x: centerX, y: centerY } = this.getBubbleCenter(index)

      if (poppedBubble.size === 'big') {
        this.spawnSplits(poppedBubble.color, 3, 'medium', centerX, centerY)
      } else if (poppedBubble.size === 'medium') {
        this.spawnSplits(poppedBubble.color, 5, 'small', centerX, centerY)
      }

      bus.emit('explosion', {x: centerX, y: centerY, size: poppedBubble.size})
      this.processScore(poppedBubble.color, poppedBubble.size)
      this.removeBubble(bubbleId)
      this.check()
    },
    handleExpiredBubble(bubbleId) {
      const index = this.activeBubbles.findIndex(b => b.id === bubbleId)
      if (index === -1) return
      const expiredBubble = this.activeBubbles[index]

      if (expiredBubble.color === this.selectColor) {
        if (expiredBubble.size === 'big') {
          this.score -= this.fine + 5
        } else if (expiredBubble.size === 'medium') {
          this.score -= this.fine + 1
        } else {
          this.score -= this.fine - 2
        }
        this.check()
      }
      this.removeBubble(bubbleId)
    },
    spawnSplits(parentColor, count, newSize, currentX, currentY) {
      const colors = Object.keys(this.colorMap)
      const radius = 60

      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI) / count
        const offsetX = Math.cos(angle) * radius
        const offsetY = Math.sin(angle) * radius

        const color = (i === 0) ? parentColor : colors[Math.floor(Math.random() * colors.length)]

        this.activeBubbles.push({
          id: Date.now() + Math.random(),
          color: color,
          size: newSize,
          amplitude: 15,
          offset: Math.random() * 100,
          initialX: currentX + offsetX,
          initialY: currentY + offsetY,
        })
      }
    },
    removeBubble(bubbleId) {
      const index = this.activeBubbles.findIndex(b => b.id === bubbleId)
      if (index !== -1) {
        this.activeBubbles.splice(index, 1)
      }
    },
    getBubbleCenter(index) {
      const bubbleComponent = this.$refs.bubble[index]
      const fieldElement = this.$el.querySelector('.bubble-game__field')

      if (!bubbleComponent || !fieldElement) {
        return { x: 0, y: 0 }
      }

      const rect = bubbleComponent.$el.getBoundingClientRect()
      const fieldRect = fieldElement.getBoundingClientRect()

      return {
        x: (rect.left - fieldRect.left) + rect.width / 2,
        y: (rect.top - fieldRect.top) + rect.height / 2
      }
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
  padding: 10px;
  background-color: #f8f9fa;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

  &__score {
    display: flex;
    align-items: center;
    gap: 20px;
    font-size: 20px;
    color: #0879ea;
  }

  &__color {
    display: inline-block;
    vertical-align: middle;
    border-radius: 50%;
    width: 20px;
    height: 20px;
  }
}
</style>