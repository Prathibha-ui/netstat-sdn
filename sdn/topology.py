#!/usr/bin/env python3
"""
NETSTAT - Mininet Network Topology Simulation
Defines an SDN topology with:
  - 1 Open vSwitch (s1) running OpenFlow 1.3
  - 1 Ryu SDN Remote Controller (c0)
  - 1 Hostel Gateway / Internet Router (gateway)
  - 3 Student hosts:
      * h1: Student 23CS001 Trusted Device (MAC AA:BB:CC:11:22:33)
      * h2: Student 23CS002 Registered Device (MAC 52:54:00:12:34:56)
      * h3: Unauthorized Secondary Device (MAC DD:EE:FF:44:55:66)
"""

import sys
from mininet.net import Mininet
from mininet.node import RemoteController, OVSKernelSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info

def create_netstat_topology(controller_ip='127.0.0.1', controller_port=6653):
    info('*** Building NETSTAT SDN Access Control Topology\n')
    net = Mininet(
        controller=RemoteController,
        switch=OVSKernelSwitch,
        autoSetMacs=False,
        autoStaticArp=False
    )

    info('*** Adding SDN Remote Controller\n')
    c0 = net.addController(
        'c0',
        controller=RemoteController,
        ip=controller_ip,
        port=controller_port
    )

    info('*** Adding Open vSwitch with OpenFlow 1.3\n')
    # protocols='OpenFlow13' enforces OpenFlow 1.3 standard
    s1 = net.addSwitch('s1', protocols='OpenFlow13', dpid='0000000000000001')

    info('*** Adding Hostel Gateway Router\n')
    gw = net.addHost(
        'gw',
        ip='10.0.0.1/24',
        mac='00:00:5E:00:53:01',
        defaultRoute='via 10.0.0.1'
    )

    info('*** Adding Student Hosts\n')
    # h1: Registered primary device for Student 23CS001
    h1 = net.addHost(
        'h1',
        ip='10.0.0.101/24',
        mac='aa:bb:cc:11:22:33',
        defaultRoute='via 10.0.0.1'
    )

    # h2: Registered device for Student 23CS002
    h2 = net.addHost(
        'h2',
        ip='10.0.0.102/24',
        mac='52:54:00:12:34:56',
        defaultRoute='via 10.0.0.1'
    )

    # h3: Unauthorized secondary device (simulating student attempting second connection)
    h3 = net.addHost(
        'h3',
        ip='10.0.0.199/24',
        mac='dd:ee:ff:44:55:66',
        defaultRoute='via 10.0.0.1'
    )

    info('*** Creating Switch Links\n')
    net.addLink(gw, s1, port2=1)   # Port 1: Gateway Uplink
    net.addLink(h1, s1, port2=2)   # Port 2: Student 23CS001 Trusted Host
    net.addLink(h2, s1, port2=3)   # Port 3: Student 23CS002 Host
    net.addLink(h3, s1, port2=4)   # Port 4: Unauthorized Host

    info('*** Starting Network\n')
    net.start()

    info('\n======================================================\n')
    info(' NETSTAT SDN Topology is ACTIVE\n')
    info(' Open vSwitch : s1 (DPID 0000000000000001) [OpenFlow 1.3]\n')
    info(' Controller   : c0 -> %s:%d\n' % (controller_ip, controller_port))
    info(' Gateway      : gw (10.0.0.1, 00:00:5E:00:53:01) on s1-eth1\n')
    info(' Host h1      : 10.0.0.101 (AA:BB:CC:11:22:33) on s1-eth2 [Student 23CS001]\n')
    info(' Host h2      : 10.0.0.102 (52:54:00:12:34:56) on s1-eth3 [Student 23CS002]\n')
    info(' Host h3      : 10.0.0.199 (DD:EE:FF:44:55:66) on s1-eth4 [Unauthorized 2nd Device]\n')
    info('======================================================\n\n')

    info('*** Running Mininet CLI (Type "exit" to terminate)\n')
    CLI(net)

    info('*** Stopping Network\n')
    net.stop()

if __name__ == '__main__':
    setLogLevel('info')
    c_ip = sys.argv[1] if len(sys.argv) > 1 else '127.0.0.1'
    c_port = int(sys.argv[2]) if len(sys.argv) > 2 else 6653
    create_netstat_topology(c_ip, c_port)
